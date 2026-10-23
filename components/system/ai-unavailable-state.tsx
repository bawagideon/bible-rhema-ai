"use client";

import { useRouter } from "next/navigation";

interface AiUnavailableStateProps {
    onRetry?: () => void;
    onOpenReader?: () => void;
    className?: string;
}

export function AiUnavailableState({ onRetry, onOpenReader, className = "" }: AiUnavailableStateProps) {
    const router = useRouter();

    return (
        <div className={`card p-6 flex flex-col gap-3.5 ${className}`}>
            <div className="flex flex-col gap-3 items-start">
                <span className="text-[#F3E5AB]">
                    <svg className="w-[26px] h-[26px] fill-none stroke-currentColor stroke-[1.6] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
                    </svg>
                </span>
                <h3 className="serif text-[22px] font-semibold text-white tracking-tight leading-snug">
                    The study assistant is unavailable
                </h3>
                <p className="muted text-sm leading-relaxed max-w-lg">
                    Your question was not counted toward today’s limit. You can still read Scripture and use Sanctuary.
                </p>
                <div className="flex gap-2 flex-wrap pt-1">
                    {onRetry && (
                        <button onClick={onRetry} className="btn btn-s">
                            Retry
                        </button>
                    )}
                    <button
                        onClick={onOpenReader || (() => router.push("/"))}
                        className="btn btn-q"
                    >
                        Open the reader
                    </button>
                </div>
            </div>
        </div>
    );
}

export const AIUnavailableState = AiUnavailableState;
