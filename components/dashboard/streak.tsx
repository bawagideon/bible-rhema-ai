"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakProps {
    days: number;
    className?: string;
}

export function WalkWithGodStreak({ days, className }: StreakProps) {
    const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
    const todayIndex = new Date().getDay(); // 0 is Sunday, 6 is Saturday

    return (
        <div className={cn("flex flex-col items-end gap-1.5", className)}>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full animate-pulse" />
                    <Flame className={cn("w-5 h-5", days > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground")} />
                </div>
                <div className="text-right">
                    <span className="text-sm md:text-base font-bold font-serif leading-none text-white tracking-wide">{days} DAY STREAK</span>
                </div>
            </div>

            {/* 7-Day Dots Indicator */}
            <div className="flex items-center gap-1.5 pt-0.5">
                {DAYS.map((label, idx) => {
                    const isCompleted = idx <= todayIndex && days > 0;
                    const isToday = idx === todayIndex;
                    return (
                        <div key={idx} className="flex flex-col items-center gap-0.5">
                            <div
                                className={cn(
                                    "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all",
                                    isCompleted
                                        ? "bg-[#D4AF37] text-black shadow-sm shadow-[#D4AF37]/30 ring-1 ring-[#D4AF37]"
                                        : isToday
                                            ? "border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                                            : "border border-gray-800 bg-[#161616] text-gray-600"
                                )}
                            >
                                {isCompleted ? "✓" : ""}
                            </div>
                            <span className={cn("text-[9px] font-medium leading-none", isToday ? "text-[#D4AF37]" : "text-gray-500")}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
