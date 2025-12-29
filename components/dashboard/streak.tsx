"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakProps {
    days: number;
    className?: string;
}

export function WalkWithGodStreak({ days, className }: StreakProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full animate-pulse" />
                <Flame className={cn("w-6 h-6", days > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground")} />
            </div>
            <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">{days}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Day Streak</span>
            </div>
        </div>
    );
}
