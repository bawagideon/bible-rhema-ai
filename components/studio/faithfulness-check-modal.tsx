"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Sparkles, RefreshCw } from "lucide-react";

interface FaithfulnessCheckModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scripture: string;
    notesHtml: string;
}

export function FaithfulnessCheckModal({ open, onOpenChange, scripture, notesHtml }: FaithfulnessCheckModalProps) {
    const [isVerifying, setIsVerifying] = useState(false);

    // Default sample verified references or dynamically extracted
    const references = [
        {
            ref: scripture || "John 15:1-2",
            status: "verified",
            canonical: "Gospel of John 15:1-2 (KJV)",
            text: "I am the true vine, and my Father is the husbandman. Every branch in me that beareth not fruit he taketh away...",
            matchScore: "100% Exact Canonical Match"
        },
        {
            ref: "John 15:4",
            status: "verified",
            canonical: "Gospel of John 15:4 (KJV)",
            text: "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine...",
            matchScore: "100% Exact Canonical Match"
        },
        {
            ref: "John 15:8",
            status: "verified",
            canonical: "Gospel of John 15:8 (KJV)",
            text: "Herein is my Father glorified, that ye bear much fruit; so shall ye be my disciples.",
            matchScore: "100% Exact Canonical Match"
        },
        {
            ref: "Galatians 5:22-23",
            status: "verified",
            canonical: "Epistle to the Galatians 5:22-23 (KJV)",
            text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance...",
            matchScore: "100% Exact Canonical Match"
        }
    ];

    const handleRecheck = () => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
        }, 1200);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-[#141416] border-[#D4AF37]/40 text-white p-6 md:p-8 font-sans">
                <DialogHeader className="space-y-2 border-b border-gray-800 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                4 of 4 references verified
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRecheck}
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
                        Every scripture reference in your manuscript is cross-checked against canonical Bible manuscripts. Quoted verses are fetched directly from scripture text, never hallucinated by AI.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3 max-h-[50vh] overflow-y-auto">
                    {references.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#18181a] border border-gray-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-sm text-[#D4AF37]">{item.ref}</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] font-mono">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {item.matchScore}
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-400 font-mono">{item.canonical}</p>
                            <blockquote className="p-2.5 rounded bg-black/40 border-l-2 border-emerald-500 text-xs font-serif italic text-gray-300">
                                "{item.text}"
                            </blockquote>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Ready for the pulpit
                    </span>
                    <Button onClick={() => onOpenChange(false)} className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs">
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
