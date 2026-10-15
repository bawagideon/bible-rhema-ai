"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, ArrowRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface DailyLimitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    used?: number;
    total?: number;
}

export function DailyLimitModal({ open, onOpenChange, used = 5, total = 5 }: DailyLimitModalProps) {
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#141416] border-[#D4AF37]/40 text-white p-6 md:p-8 font-sans text-center">
                <DialogHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] border-[#D4AF37]/40 text-[#D4AF37] font-mono uppercase">
                            Seeker Daily Quota Reached ({used}/{total})
                        </Badge>
                        <DialogTitle className="font-serif text-2xl text-white">
                            Daily SpiritOS Limit Reached
                        </DialogTitle>
                    </div>

                    <DialogDescription className="text-gray-400 text-xs leading-relaxed">
                        Seeker plans include 5 SpiritOS inquiries per day. Your quota will refresh tonight at midnight. Upgrade to Minister for unlimited inquiries, sermon manuscripts, and pulpit teleprompter mode.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 text-xs text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Quota resets
                    </span>
                    <span className="font-mono text-white">Midnight WAT (12:00 AM)</span>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            router.push('/pricing');
                        }}
                        className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs py-5 flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Minister (₦15,000 / mo)
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full text-xs text-gray-400 hover:text-white"
                    >
                        Wait until midnight
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
