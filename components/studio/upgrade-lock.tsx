"use client";

import { useRhema } from "@/lib/store/rhema-context";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UpgradeLockProps {
    children: React.ReactNode;
    minTier?: 'DISCIPLE' | 'MINISTER';
    blurAmount?: 'none' | 'sm' | 'md' | 'lg';
}

const TIER_levels = {
    'SEEKER': 0,
    'DISCIPLE': 1,
    'MINISTER': 2
};

export function UpgradeLock({ children, minTier = 'MINISTER', blurAmount = 'sm' }: UpgradeLockProps) {
    const { userTier } = useRhema();

    // Check if user has access
    // If userTier is undefined (loading), we might show a skeleton or just render children to avoid flash of lock,
    // or render lock to be safe. Let's assume loading state handled in context or we default to safe "SEEKER".
    const currentLevel = TIER_levels[userTier] || 0;
    const requiredLevel = TIER_levels[minTier];

    const hasAccess = currentLevel >= requiredLevel;

    if (hasAccess) {
        return <>{children}</>;
    }

    return (
        <div className="relative group overflow-hidden rounded-md border border-gray-800/50">
            {/* Blurred Content (Non-interactive) */}
            <div className={`filter blur-${blurAmount} pointer-events-none select-none opacity-50 transition-all duration-500`}>
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <div className="bg-[#0a0a0a]/90 border border-[#D4AF37]/30 p-6 rounded-xl shadow-2xl flex flex-col items-center text-center max-w-xs animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-[#D4AF37]/20 p-3 rounded-full mb-3">
                        <Lock className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 font-serif">
                        {minTier === 'MINISTER' ? 'Minister Feature' : 'Premium Feature'}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                        Unlock powerful tools like AI Generation, PDF Export, and more with the {minTier === 'MINISTER' ? 'Kingdom Builder' : 'Growing Faith'} plan.
                    </p>
                    <Link href="/pricing" className="w-full">
                        <Button className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold">
                            Upgrade Now
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
