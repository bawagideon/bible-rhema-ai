"use client";

import { useState, useEffect } from "react";
import { WifiOff, X } from "lucide-react";

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        if (typeof window !== "undefined") {
            setIsOffline(!navigator.onLine);
            window.addEventListener("offline", handleOffline);
            window.addEventListener("online", handleOnline);
        }

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (!isOffline || dismissed) return null;

    return (
        <div className="bg-[#1e140a] border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-50 sticky top-0 font-sans shadow-md">
            <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 justify-center">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                    You are currently offline. Local notes, saved scriptures, and procedural Levite audio remain fully accessible.
                </span>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="text-amber-400/80 hover:text-white p-1"
                title="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
