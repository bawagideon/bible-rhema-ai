"use client";

import React from "react";
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
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          {days > 0 ? (
            <svg
              className="fl w-6 h-6"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="fg-streak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFF4C7" />
                  <stop offset="0.5" stopColor="#E7C762" />
                  <stop offset="1" stopColor="#B8912B" />
                </linearGradient>
              </defs>
              <path
                d="M12 2c1.2 3.4 5.8 5.4 5.8 11a5.8 5.8 0 0 1-11.6 0c0-2.4 1.1-3.8 2.4-4.8 0 2.2 1.1 3.5 2.4 3.5C10.2 8.4 10.6 5 12 2z"
                fill="url(#fg-streak)"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-[#8F8F98]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 2c1.2 3.4 5.8 5.4 5.8 11a5.8 5.8 0 0 1-11.6 0c0-2.4 1.1-3.8 2.4-4.8 0 2.2 1.1 3.5 2.4 3.5C10.2 8.4 10.6 5 12 2z" />
            </svg>
          )}
        </div>
        <div className="text-right">
          <span className="serif text-sm md:text-base font-bold leading-none text-[#F3E5AB] tracking-wide">
            {days} DAY STREAK
          </span>
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
                    : "border border-zinc-800 bg-[#161618] text-zinc-600"
                )}
              >
                {isCompleted ? "✓" : ""}
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium leading-none",
                  isToday ? "text-[#D4AF37]" : "text-zinc-500"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
