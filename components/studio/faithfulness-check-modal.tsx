"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, BookOpen, AlertCircle, Info } from "lucide-react";
import { extractAllScriptureReferences } from "@/lib/bible/api-bible";

export interface VerifiedReference {
    ref: string;
    normalizedRef?: string;
    status: 'verified' | 'partial' | 'translation-mismatch' | 'excerpt' | 'unverified' | 'error' | 'pending';
    translation?: string;
    requestedTranslation?: string;
    isTranslationMismatch?: boolean;
    text?: string;
    source?: string;
    error?: string;
    verseRangeCovered?: boolean;
    isExcerpt?: boolean;
    quotationCompleteness?: 'full' | 'excerpt';
    attributionNote?: string;
}

interface FaithfulnessCheckModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scripture: string;
    notesHtml: string;
    onVerificationUpdate?: (verified: number, total: number) => void;
}

export function FaithfulnessCheckModal({
    open,
    onOpenChange,
    scripture,
    notesHtml,
    onVerificationUpdate
}: FaithfulnessCheckModalProps) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [results, setResults] = useState<VerifiedReference[]>([]);
    const [hasChecked, setHasChecked] = useState(false);

    const performVerification = useCallback(async () => {
        setIsVerifying(true);
        try {
            // 1. Extract all references from anchor scripture and manuscript body
            const combinedContent = `${scripture || ''} ${notesHtml || ''}`;
            const extracted = extractAllScriptureReferences(combinedContent);

            // Also include key scripture explicitly if it has chapter:verse structure and was missed
            if (scripture && scripture.trim()) {
                const cleanKey = scripture.trim();
                if (!extracted.some(e => e.toLowerCase() === cleanKey.toLowerCase())) {
                    const keyMatches = extractAllScriptureReferences(cleanKey);
                    if (keyMatches.length > 0) {
                        for (const km of keyMatches) {
                            if (!extracted.includes(km)) extracted.unshift(km);
                        }
                    } else if (cleanKey.match(/\d/)) {
                        extracted.unshift(cleanKey);
                    }
                }
            }

            if (extracted.length === 0) {
                setResults([]);
                setHasChecked(true);
                onVerificationUpdate?.(0, 0);
                return;
            }

            // 2. Verify each reference live against /api/bible
            const verifiedList: VerifiedReference[] = await Promise.all(
                extracted.map(async (ref): Promise<VerifiedReference> => {
                    try {
                        const res = await fetch(`/api/bible?ref=${encodeURIComponent(ref)}`);
                        if (res.ok) {
                            const json = await res.json();
                            if (json.success && json.data) {
                                const isRangeCovered = json.data.verseRangeCovered === true;
                                const isMismatch = Boolean(json.data.isTranslationMismatch);
                                const isExcerpt = Boolean(json.data.isExcerpt) || json.data.quotationCompleteness === 'excerpt';

                                let status: 'verified' | 'partial' | 'translation-mismatch' | 'excerpt' | 'unverified' = 'unverified';
                                if (!isRangeCovered) {
                                    status = 'partial';
                                } else if (isMismatch) {
                                    status = 'translation-mismatch';
                                } else if (isExcerpt) {
                                    status = 'excerpt';
                                } else if (isRangeCovered && !isMismatch && !isExcerpt) {
                                    status = 'verified';
                                }

                                return {
                                    ref: json.data.reference || ref,
                                    normalizedRef: json.data.normalizedReference,
                                    status,
                                    translation: json.data.translation || 'Canonical',
                                    requestedTranslation: json.data.requestedTranslation,
                                    isTranslationMismatch: isMismatch,
                                    text: json.data.text,
                                    source: json.data.source,
                                    verseRangeCovered: isRangeCovered,
                                    isExcerpt: json.data.isExcerpt,
                                    quotationCompleteness: json.data.quotationCompleteness,
                                    attributionNote: json.data.attributionNote
                                };
                            }
                        }
                        return {
                            ref,
                            status: 'unverified',
                            error: 'Could not resolve passage in canonical database. Verify book and chapter:verse syntax.'
                        };
                    } catch (e: any) {
                        return {
                            ref,
                            status: 'error',
                            error: e.message || 'Network error verifying passage.'
                        };
                    }
                })
            );

            setResults(verifiedList);
            setHasChecked(true);
            const verifiedCount = verifiedList.filter(r => r.status === 'verified').length;
            onVerificationUpdate?.(verifiedCount, verifiedList.length);
        } finally {
            setIsVerifying(false);
        }
    }, [scripture, notesHtml, onVerificationUpdate]);

    useEffect(() => {
        if (open) {
            performVerification();
        }
    }, [open, performVerification]);

    const verifiedCount = results.filter(r => r.status === 'verified').length;
    const partialCount = results.filter(r => r.status === 'partial').length;
    const mismatchCount = results.filter(r => r.status === 'translation-mismatch').length;
    const excerptCount = results.filter(r => r.status === 'excerpt').length;
    const unresolvedCount = results.filter(r => r.status === 'unverified' || r.status === 'error').length;
    const totalCount = results.length;
    const allVerified = totalCount > 0 && verifiedCount === totalCount;
    const hasUnresolved = unresolvedCount > 0 || partialCount > 0 || excerptCount > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-[#141416] border-[#D4AF37]/40 text-white p-6 md:p-8 font-sans">
                <DialogHeader className="space-y-2 border-b border-gray-800 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isVerifying ? (
                                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs flex items-center gap-1">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Verifying manuscript citations...
                                </Badge>
                            ) : totalCount === 0 ? (
                                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    No scripture references found
                                </Badge>
                            ) : allVerified ? (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {verifiedCount} of {totalCount} citations fully verified in canon
                                </Badge>
                            ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px]">
                                        {verifiedCount} verified
                                    </Badge>
                                    {partialCount > 0 && (
                                        <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px]">
                                            {partialCount} partial range
                                        </Badge>
                                    )}
                                    {mismatchCount > 0 && (
                                        <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[11px]">
                                            {mismatchCount} translation note
                                        </Badge>
                                    )}
                                    {excerptCount > 0 && (
                                        <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[11px]">
                                            {excerptCount} excerpt only
                                        </Badge>
                                    )}
                                    {unresolvedCount > 0 && (
                                        <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px]">
                                            {unresolvedCount} unresolved
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={performVerification}
                            disabled={isVerifying}
                            className="text-xs text-gray-400 hover:text-white"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isVerifying ? 'animate-spin text-[#D4AF37]' : ''}`} />
                            Re-verify Manuscript
                        </Button>
                    </div>

                    <DialogTitle className="font-serif text-2xl text-white">
                        Manuscript Scripture Citation & Reference Check
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs leading-relaxed">
                        Cross-checks every scripture reference cited in your manuscript against biblical manuscripts to verify passage existence and display exact canonical source text.
                    </DialogDescription>

                    {/* Theological Disclaimer Notice */}
                    <div className="p-2.5 rounded-lg bg-black/40 border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>
                            <strong>Note on Faithfulness:</strong> Reference checking verifies citation existence and text accuracy; it does not replace pastoral hermeneutical exegesis, evaluate doctrinal orthodoxy, or judge sermon interpretation.
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-3 max-h-[50vh] overflow-y-auto">
                    {/* Kindle Scan Animation when verifying */}
                    {isVerifying && (
                        <div className="stage !h-[170px] rounded-xl flex items-center justify-center border border-[rgba(243,229,171,0.15)] bg-[#0A0A0B] p-4 my-2">
                            <div className="relative w-[260px] py-1 flex flex-col gap-3">
                                <div className="sl w-[92%]" />
                                <div className="flex gap-2">
                                    <span className="cp c1">
                                        {results[0]?.ref || "John 15:4"}
                                    </span>
                                    <div className="sl flex-1 self-center" />
                                </div>
                                <div className="sl w-[80%]" />
                                <div className="flex gap-2">
                                    <span className="cp c2">
                                        {results[1]?.ref || "John 15:7"}
                                    </span>
                                    <div className="sl flex-1 self-center" />
                                </div>
                                <div className="sl w-[66%]" />
                                <div className="flex gap-2">
                                    <span className="cp c3">
                                        {results[2]?.ref || "John 15:10"}
                                    </span>
                                    <div className="sl flex-1 self-center" />
                                </div>
                                <span className="scan" />
                            </div>
                        </div>
                    )}

                    {totalCount === 0 && hasChecked && !isVerifying && (
                        <div className="p-6 text-center border border-dashed border-gray-800 rounded-xl space-y-2">
                            <BookOpen className="w-8 h-8 text-gray-500 mx-auto" />
                            <p className="text-sm font-semibold text-gray-300">No Scripture Citations Detected</p>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                                Add a key scripture (e.g. John 15:1-8, Romans 8:28) to the sermon header or write biblical citations into your manuscript to enable real-time pulpit verification.
                            </p>
                        </div>
                    )}

                    {results.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#18181a] border border-gray-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-sm text-[#D4AF37]">{item.ref}</span>
                                <div className="flex items-center gap-1.5">
                                    {item.status === 'verified' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] font-mono">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Canonical Match ({item.translation || 'ESV'})
                                        </Badge>
                                    )}
                                    {item.status === 'partial' && (
                                        <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px] font-mono">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Partial Range ({item.translation || 'ESV'})
                                        </Badge>
                                    )}
                                    {item.status === 'translation-mismatch' && (
                                        <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[10px] font-mono">
                                            <Info className="w-3 h-3 mr-1" />
                                            Translation Note ({item.translation}; req. {item.requestedTranslation || 'ESV'})
                                        </Badge>
                                    )}
                                    {item.status === 'excerpt' && (
                                        <Badge className="bg-purple-500/10 text-purple-400 border-0 text-[10px] font-mono">
                                            <Info className="w-3 h-3 mr-1" />
                                            Excerpt Only ({item.translation || 'ESV'})
                                        </Badge>
                                    )}
                                    {(item.status === 'unverified' || item.status === 'error') && (
                                        <Badge className="bg-rose-500/10 text-rose-400 border-0 text-[10px] font-mono">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Unresolved Reference
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {item.attributionNote && (
                                <p className="text-[10px] text-amber-400/90 font-mono italic">
                                    {item.attributionNote}
                                </p>
                            )}

                            {item.isExcerpt && (
                                <p className="text-[10px] text-blue-400/90 font-mono italic">
                                    Note: This passage is preserved as an excerpt in the canonical record.
                                </p>
                            )}

                            {(item.status === 'verified' || item.status === 'partial' || item.status === 'translation-mismatch') && item.text ? (
                                <blockquote className="p-2.5 rounded bg-black/40 border-l-2 border-emerald-500 text-xs font-serif italic text-gray-300">
                                    "{item.text}"
                                </blockquote>
                            ) : (
                                <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 space-y-1">
                                    <p className="font-medium">{item.error || 'Passage could not be resolved.'}</p>
                                    <p className="text-[11px] text-gray-400">Ensure the citation follows standard book and chapter:verse format (e.g. Genesis 1:1, Romans 8:1).</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                        {allVerified ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> All citations fully verified in canon
                            </span>
                        ) : hasUnresolved ? (
                            <span className="text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> Citations require review (unresolved or partial ranges)
                            </span>
                        ) : (
                            <span>{verifiedCount} citations fully verified</span>
                        )}
                    </span>
                    <Button onClick={() => onOpenChange(false)} className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs">
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
