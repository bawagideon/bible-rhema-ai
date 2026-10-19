"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Heart, Shield, ArrowRight } from "lucide-react";

interface CareMomentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CareMomentModal({ open, onOpenChange }: CareMomentModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#141416] border-[#D4AF37]/50 text-white p-6 md:p-8 font-sans">
                <DialogHeader className="space-y-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
                        <Heart className="w-6 h-6 fill-[#D4AF37]" />
                    </div>

                    <DialogTitle className="font-serif text-2xl text-white">
                        You Are Not Alone
                    </DialogTitle>

                    <blockquote className="p-4 rounded-xl bg-black/40 border-l-2 border-[#D4AF37] text-xs font-serif italic text-gray-200 text-left">
                        "The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit." — Psalm 34:18 (KJV)
                    </blockquote>

                    <DialogDescription className="text-gray-300 text-xs leading-relaxed text-left">
                        If you are walking through deep grief, overwhelming despair, or thoughts of hurting yourself, please reach out to trusted brothers, sisters, and professional care immediately. God's grace is present to sustain you.
                    </DialogDescription>
                </DialogHeader>

                {/* EMERGENCY CRISIS HOTLINES */}
                <div className="space-y-2.5 py-2">
                    <div className="p-3 rounded-xl bg-[#1a1a1e] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">Nigeria National Emergency</span>
                            <span className="text-[#D4AF37] font-mono font-bold">112</span>
                        </div>
                        <p className="text-[11px] text-gray-400">Toll-free 24/7 emergency dispatch (Police, Ambulance, Fire)</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#1a1a1e] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">Lagos MiND Lifeline</span>
                            <span className="text-[#D4AF37] font-mono font-bold text-[11px]">070 0000 6463</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Alt: 020 1410 6463 &bull; WhatsApp: 090 9000 6463 &bull; lagosmind.org
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#1a1a1e] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">MANI Crisis Helpline</span>
                            <span className="text-[#D4AF37] font-mono font-bold">0809 111 6264</span>
                        </div>
                        <p className="text-[11px] text-gray-400">Mentally Aware Nigeria Initiative (confidential counselor support)</p>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs py-5"
                    >
                        Return to Prayer & Devotion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
