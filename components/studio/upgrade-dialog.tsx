"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, FileText } from "lucide-react";
import Link from "next/link";

interface UpgradeDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    featureName?: string;
}

export function UpgradeDialog({ isOpen, onOpenChange, featureName = "Premium Feature" }: UpgradeDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-[#D4AF37]/30 text-white">
                <DialogHeader className="items-center text-center space-y-4 pt-4">
                    <div className="bg-[#D4AF37]/10 p-4 rounded-full">
                        <Lock className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                    <DialogTitle className="text-2xl font-serif">Unlock {featureName}</DialogTitle>
                    <DialogDescription className="text-gray-400 text-center max-w-xs mx-auto">
                        Upgrade to the <strong>Minister</strong> plan to access powerful tools like AI Sermon Generation and PDF Exports.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                        <div className="text-sm">
                            <p className="font-medium text-white">AI Sermon Writer</p>
                            <p className="text-gray-500 text-xs">Generate outlines & content instantly.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <FileText className="h-5 w-5 text-[#D4AF37]" />
                        <div className="text-sm">
                            <p className="font-medium text-white">PDF Export</p>
                            <p className="text-gray-500 text-xs">Download print-ready manuscripts.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 text-gray-400 hover:text-white">
                        Maybe Later
                    </Button>
                    <Link href="/pricing" className="flex-1">
                        <Button className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold">
                            Upgrade Now
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
