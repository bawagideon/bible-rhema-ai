"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck, Sparkles, Clock, ArrowRight, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface SampleOutlineModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SampleOutlineModal({ open, onOpenChange }: SampleOutlineModalProps) {
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-[#141416] border-[#D4AF37]/40 text-white p-6 md:p-8 font-sans">
                <DialogHeader className="space-y-2 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-0 text-[10px] uppercase font-mono tracking-wider">
                            Sample Minister Outline
                        </Badge>
                        <span className="text-gray-500 text-xs">·</span>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Faithfulness Check: 4 of 4 references verified</span>
                        </div>
                    </div>
                    <DialogTitle className="font-serif text-2xl md:text-3xl text-white">
                        The Vine and the Branches
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs md:text-sm flex flex-wrap items-center gap-3">
                        <span className="text-[#D4AF37] font-serif italic">John 15:1-8 (KJV)</span>
                        <span>·</span>
                        <span>Series: Kingdom Fruitfulness</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-gray-300">
                            <Clock className="w-3 h-3 text-[#D4AF37]" /> ~32 mins (4,160 words at 130 wpm)
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* OUTLINE BODY */}
                <div className="space-y-6 py-4 text-sm text-gray-300">
                    {/* SECTION 1 */}
                    <div className="p-4 rounded-xl bg-[#18181a] border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase text-[#D4AF37]">Point I · 8 mins</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">Verified Scripture</Badge>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-white">The True Vine and the Husbandman</h4>
                        <blockquote className="p-3 bg-black/40 border-l-2 border-[#D4AF37] text-xs font-serif italic text-gray-200">
                            "I am the true vine, and my Father is the husbandman. Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit." — John 15:1-2
                        </blockquote>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Christ establishes that spiritual vitality is not self-generated. The pruning process (Greek: <em>kathairei</em>) is not punitive; it is the deliberate curation of the Father to remove secondary distractions so primary fruit may flourish.
                        </p>
                        <div className="text-[11px] bg-[#D4AF37]/10 p-2 rounded border border-[#D4AF37]/20 text-gray-300">
                            <strong className="text-[#D4AF37]">Illustration Idea:</strong> The master vintner in Judean hillside vineyards who cleans the dust from low-hanging branches rather than cutting them down.
                        </div>
                    </div>

                    {/* SECTION 2 */}
                    <div className="p-4 rounded-xl bg-[#18181a] border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase text-[#D4AF37]">Point II · 12 mins</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">Verified Scripture</Badge>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-white">The Law of Total Dependence (Abiding)</h4>
                        <blockquote className="p-3 bg-black/40 border-l-2 border-[#D4AF37] text-xs font-serif italic text-gray-200">
                            "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me." — John 15:4
                        </blockquote>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            A branch severed from the vine does not struggle to produce grapes; it simply withers. We do not manufacture fruit through human striving; fruit is the involuntary consequence of continuous communion.
                        </p>
                    </div>

                    {/* SECTION 3 */}
                    <div className="p-4 rounded-xl bg-[#18181a] border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase text-[#D4AF37]">Point III · 10 mins</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">Verified Scripture</Badge>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-white">Much Fruit: The Father's Glory</h4>
                        <blockquote className="p-3 bg-black/40 border-l-2 border-[#D4AF37] text-xs font-serif italic text-gray-200">
                            "Herein is my Father glorified, that ye bear much fruit; so shall ye be my disciples." — John 15:8
                        </blockquote>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            The ultimate aim of abiding is doxological. Our fruitfulness serves as empirical evidence before the world of Christ's indwelling power.
                        </p>
                    </div>

                    {/* ALTAR CALL */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#18181a] to-[#221c14] border border-[#D4AF37]/30 space-y-2">
                        <span className="text-xs font-mono uppercase text-[#D4AF37]">Altar Call & Impartation · 5 mins</span>
                        <h4 className="font-serif text-base font-semibold text-white">Surrendering the Striving</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            Invite those exhausted by self-reliant religious effort to return to the place of stillness and abiding in prayer.
                        </p>
                    </div>
                </div>

                {/* FOOTER CTA */}
                <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-gray-400 text-center sm:text-left">
                        Unlock this workspace, auto-scroll Preach mode, and Verified Scripture.
                    </div>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            router.push('/pricing');
                        }}
                        className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs py-5 px-6 flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                    >
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Minister (₦15,000 / mo)
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
