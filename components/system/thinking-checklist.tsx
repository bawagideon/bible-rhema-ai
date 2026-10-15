"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";

interface ThinkingChecklistProps {
    className?: string;
}

export function ThinkingChecklist({ className = "" }: ThinkingChecklistProps) {
    const [step, setStep] = useState(0);

    const steps = [
        "Locating canonical scripture passages...",
        "Analyzing Greek & Hebrew root manuscripts...",
        "Synthesizing theological context & cross-references..."
    ];

    useEffect(() => {
        const t1 = setTimeout(() => setStep(1), 800);
        const t2 = setTimeout(() => setStep(2), 1800);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    return (
        <div className={`p-4 rounded-xl bg-[#141416] border border-gray-800 text-xs text-gray-300 space-y-2.5 max-w-sm ${className}`}>
            <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>SpiritOS Theological Engine</span>
            </div>

            <div className="space-y-2 pt-1 font-mono">
                {steps.map((text, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        {step > idx ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                            </div>
                        ) : step === idx ? (
                            <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                        ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-700" />
                        )}
                        <span className={step >= idx ? "text-gray-200" : "text-gray-600"}>
                            {text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
