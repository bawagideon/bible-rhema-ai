"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, BookOpen, AlertCircle } from "lucide-react";
import { extractAllScriptureReferences } from "@/lib/bible/api-bible";

export interface VerifiedReference {
    ref: string;
    status: 'verified' | 'unverified' | 'pending';
    translation?: string;
    text?: string;
    source?: string;
    error?: string;
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
                                return {
                                    ref: json.data.reference || ref,
                                    status: 'verified',
                                    translation: json.data.translation || 'Canonical',
                                    text: json.data.text,
                                    source: json.data.source
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
                            status: 'unverified',
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
    const totalCount = results.length;
    const allVerified = totalCount > 0 && verifiedCount === totalCount;
    const hasUnverified = results.some(r => r.status === 'unverified');

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
                                    {verifiedCount} of {totalCount} references verified
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {verifiedCount} of {totalCount} verified · {totalCount - verifiedCount} unresolved
                                </Badge>
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
                        Manuscript Faithfulness Check
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs">
                        Every scripture reference cited in your sermon is checked against canonical Bible manuscripts. Quoted verses are fetched directly from scripture text, never hallucinated by AI.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3 max-h-[50vh] overflow-y-auto">
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
                                {item.status === 'verified' ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] font-mono">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Verified Canonical ({item.translation || 'KJV'})
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px] font-mono">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Unverified Reference
                                    </Badge>
                                )}
                            </div>

                            {item.status === 'verified' && item.text ? (
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
                                <CheckCircle2 className="w-4 h-4" /> Ready for the pulpit
                            </span>
                        ) : hasUnverified ? (
                            <span className="text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> Please review unresolved citations
                            </span>
                        ) : (
                            <span>Scripture First Verification Engine</span>
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
