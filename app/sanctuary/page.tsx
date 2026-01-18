"use client";

import { BreathingOrb } from "@/components/sanctuary/breathing-orb";
import { ScriptureSoak } from "@/components/sanctuary/scripture-soak";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mood-based color themes (Tailwind classes or raw hex for Framer Motion)
const MOOD_THEMES: Record<string, string> = {
    anxious: "from-blue-900/40 via-background to-background",
    overwhelmed: "from-teal-900/40 via-background to-background",
    fearful: "from-purple-900/40 via-background to-background",
    anger: "from-red-900/40 via-background to-background",
    sad: "from-indigo-900/40 via-background to-background",
    default: "from-primary/10 via-background to-background"
};

export default function SanctuaryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get('mode') || 'default';
    const autoStart = searchParams.get('autoStart') === 'true';

    // Theme logic
    const bgGradient = MOOD_THEMES[mode] || MOOD_THEMES['default'];

    return (
        <div className="relative h-full w-full bg-background overflow-hidden flex flex-col">
            {/* Dynamic Ambient Background Layer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className={cn(
                    "absolute inset-0 z-0 bg-gradient-to-b",
                    bgGradient
                )}
            />
            {/* Noise Overlay */}
            <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

            {/* EXIT BUTTON (Since Header is hidden in Cinema Mode) */}
            <div className="absolute top-6 left-6 z-50">
                <Link href="/">
                    <Button
                        variant="ghost"
                        className="group text-muted-foreground hover:text-foreground transition-colors gap-2"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-xs uppercase tracking-widest font-medium">Exit Sanctuary</span>
                    </Button>
                </Link>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
                {/* The Scripture Text (Background Layer) */}
                <div className="absolute inset-0 flex items-center justify-center z-0 scale-90 md:scale-100 opacity-60">
                    <ScriptureSoak mode={mode} />
                </div>

                {/* The Breathing Orb (Foreground Focus) */}
                <div className="relative z-20 mt-0 scale-125 md:scale-150 transform transition-transform duration-1000">
                    <BreathingOrb mode={mode} autoStart={autoStart} />
                </div>
            </main>
        </div>
    );
}
