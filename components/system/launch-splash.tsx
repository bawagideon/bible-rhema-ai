"use client";

import Image from "next/image";

interface LaunchSplashProps {
    message?: string;
    className?: string;
}

export function LaunchSplash({ message = "Opening Scripture…", className = "" }: LaunchSplashProps) {
    return (
        <div className={`card p-6 flex flex-col items-center justify-center ${className}`}>
            <div className="w-full h-[230px] flex flex-col items-center justify-center gap-4 bg-[#0A0A0B] rounded-[14px]">
                <div className="relative w-[84px] h-[84px] flex items-center justify-center">
                    <Image
                        src="/files/bible-rhema-ai-emblem.png"
                        alt="Bible Rhema AI"
                        width={84}
                        height={84}
                        className="w-[84px] h-[84px] object-contain drop-shadow-[0_0_14px_rgba(212,175,55,0.45)]"
                        priority
                    />
                </div>
                <span className="text-[#A1A1AA] text-sm tracking-wide font-sans">{message}</span>
            </div>
        </div>
    );
}
