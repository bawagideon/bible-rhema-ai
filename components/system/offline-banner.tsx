"use client";

import { useState, useEffect } from "react";

interface OfflineBannerProps {
    className?: string;
    showLowDataNotice?: boolean;
}

export function OfflineBanner({ className = "", showLowDataNotice = false }: OfflineBannerProps) {
    const [isOffline, setIsOffline] = useState(false);
    const [lowData, setLowData] = useState(showLowDataNotice);

    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check for Data Saver or low connection mode
        // eslint-disable-next-line
        const conn = (navigator as any).connection;
        if (conn?.saveData) {
            setLowData(true);
            document.body.classList.add("low-data");
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!isOffline && !lowData) return null;

    return (
        <div className={`flex flex-col gap-2.5 ${className}`}>
            {isOffline && (
                <div
                    role="status"
                    className="flex gap-3 items-center px-4 py-3.5 rounded-[14px] bg-[rgba(243,229,171,0.06)] border border-[rgba(243,229,171,0.14)] text-white"
                >
                    <span className="text-[#F3E5AB] flex-none">
                        <svg className="w-5 h-5 fill-none stroke-currentColor stroke-[1.6] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01" />
                        </svg>
                    </span>
                    <span className="text-sm font-sans leading-relaxed">
                        You are offline. Daily Rhema and your saved items are still available.
                    </span>
                </div>
            )}

            {lowData && (
                <div
                    role="status"
                    className="flex gap-3 items-center px-4 py-3.5 rounded-[14px] bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.3)] text-[#F3E5AB]"
                >
                    <span className="text-sm font-sans leading-relaxed">
                        Low-data mode is on. Sound and animations are paused.
                    </span>
                </div>
            )}
        </div>
    );
}
