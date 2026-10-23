"use client";

import { useEffect, useState } from "react";

interface ThinkingChecklistProps {
    scriptureRef?: string;
    className?: string;
}

export function ThinkingChecklist({ scriptureRef = "John 15:1–8", className = "" }: ThinkingChecklistProps) {
    const [step, setStep] = useState(2); // Starts on step 3 (preparing your answer) with 1 & 2 resolved

    useEffect(() => {
        const timer = setTimeout(() => {
            setStep(3);
        }, 2200);
        return () => clearTimeout(timer);
    }, []);

    const steps = [
        { label: `Reading ${scriptureRef}` },
        { label: "Finding cross-references" },
        { label: "Preparing your answer" },
        { label: "Checking verse references" },
    ];

    return (
        <div className={`card p-6 flex flex-col gap-3.5 max-w-md ${className}`}>
            <div className="flex flex-col gap-3">
                {steps.map((s, idx) => {
                    const isDone = idx < step;
                    const isCurrent = idx === step;
                    const isPending = idx > step;

                    return (
                        <div
                            key={idx}
                            className={`flex gap-3 items-center text-sm font-sans ${
                                isCurrent ? "text-[#F3E5AB] font-medium" : isDone ? "text-[#E4E4E7]" : "text-[#8F8F98]"
                            }`}
                        >
                            {isDone ? (
                                <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0A0A0B] flex items-center justify-center flex-none">
                                    <svg className="w-3 h-3 stroke-[2.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5 9-11" />
                                    </svg>
                                </span>
                            ) : isCurrent ? (
                                <span className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin flex-none" />
                            ) : (
                                <span className="w-5 h-5 rounded-full border-2 border-[#3A3A40] flex-none" />
                            )}
                            <span>{s.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="h-[1px] bg-[rgba(243,229,171,0.08)] my-1" />

            {/* Skeleton text pulsing lines */}
            <div className="flex flex-col gap-2.5 pt-1">
                <span className="skel h-3 w-full" />
                <span className="skel h-3 w-[94%]" />
                <span className="skel h-3 w-[62%]" />
            </div>
        </div>
    );
}
