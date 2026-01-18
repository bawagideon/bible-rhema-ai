"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const MOODS = [
    { emoji: "😰", label: "Anxious", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { emoji: "😞", label: "Discouraged", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    { emoji: "😤", label: "Angry", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    { emoji: "😕", label: "Lost", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { emoji: "🙏", label: "Grateful", color: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
];

export function EmotionalTriage() {
    const router = useRouter();
    const [selectedMood, setSelectedMood] = useState<string | null>(null);

    const handleMoodClick = (mood: string) => {
        setSelectedMood(mood);
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 800)),
            {
                loading: `Preparing Sanctuary for ${mood.toLowerCase()}...`,
                success: "Enter the Presence.",
                error: "Error"
            }
        );

        setTimeout(() => {
            router.push(`/sanctuary?mode=${mood.toLowerCase()}&autoStart=true`);
        }, 1000);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                How is your spirit today?
            </h3>
            <div className="grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                    <button
                        key={mood.label}
                        onClick={() => handleMoodClick(mood.label)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-105",
                            selectedMood === mood.label ? mood.color + " ring-1 ring-inset" : "bg-card hover:bg-muted border-border"
                        )}
                    >
                        <span className="text-2xl mb-1">{mood.emoji}</span>
                        <span className="text-[10px] font-medium opacity-80">{mood.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
