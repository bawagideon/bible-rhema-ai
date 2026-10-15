"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SystemErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
}

export function SystemErrorState({
    title = "Something disrupted the Rhema stream",
    description = "A connection interruption occurred while communicating with the theological engine. Your local notes and saved library remain safe.",
    onRetry
}: SystemErrorStateProps) {
    const router = useRouter();

    return (
        <div className="p-8 md:p-12 rounded-2xl bg-[#141416] border border-rose-500/30 text-center max-w-lg mx-auto space-y-4 font-sans">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-white tracking-tight">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">{description}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs py-5 px-5"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Retry Connection
                    </Button>
                )}
                <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full sm:w-auto border-gray-800 text-gray-300 hover:text-white text-xs py-5 px-5"
                >
                    <Home className="w-3.5 h-3.5 mr-1.5" />
                    Return to Sanctuary
                </Button>
            </div>
        </div>
    );
}
