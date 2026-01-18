"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BreathingOrbProps {
    mode?: string;
    autoStart?: boolean;
}

const MODE_CONFIG: Record<string, { inhale: string, exhale: string, color: string }> = {
    anxious: { inhale: "Inhale Peace", exhale: "Release Fear", color: "from-blue-400 to-blue-600" },
    overwhelmed: { inhale: "Inhale Strength", exhale: "Release Burden", color: "from-teal-400 to-teal-600" },
    anger: { inhale: "Inhale Patience", exhale: "Release Rage", color: "from-red-400 to-red-600" },
    sad: { inhale: "Inhale Comfort", exhale: "Release Grief", color: "from-indigo-400 to-indigo-600" },
    default: { inhale: "Inhale Grace", exhale: "Release Worry", color: "from-[#D4AF37] to-[#8A6E24]" }
};

export function BreathingOrb({ mode = 'default', autoStart = false }: BreathingOrbProps) {
    const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

    // Config based on mode
    const config = MODE_CONFIG[mode] || MODE_CONFIG['default'];

    useEffect(() => {
        const breathe = async () => {
            while (true) {
                setBreathPhase("inhale");
                await new Promise(r => setTimeout(r, 4000));

                setBreathPhase("hold");
                await new Promise(r => setTimeout(r, 2000));

                setBreathPhase("exhale");
                await new Promise(r => setTimeout(r, 4000));

                // Small pause
                await new Promise(r => setTimeout(r, 1000));
            }
        };
        breathe();
    }, []);

    const variants = {
        inhale: { scale: 1.5, opacity: 0.8, filter: "brightness(1.2)" },
        hold: { scale: 1.55, opacity: 0.9, filter: "brightness(1.3)" },
        exhale: { scale: 1, opacity: 0.5, filter: "brightness(1)" }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full relative z-10">
            {/* The Orb */}
            <div className="relative flex items-center justify-center">
                {/* Glow Layers */}
                <motion.div
                    animate={breathPhase}
                    variants={variants}
                    transition={{ duration: breathPhase === 'hold' ? 2 : 4, ease: "easeInOut" }}
                    className={cn("absolute w-48 h-48 rounded-full blur-3xl opacity-30", config.color.split(' ')[1].replace('to-', 'bg-'))}
                />
                <motion.div
                    animate={breathPhase}
                    variants={variants}
                    transition={{ duration: breathPhase === 'hold' ? 2 : 4, ease: "easeInOut" }}
                    className={cn("absolute w-32 h-32 rounded-full blur-2xl opacity-40", config.color.split(' ')[1].replace('to-', 'bg-'))}
                />

                {/* Core */}
                <motion.div
                    animate={breathPhase}
                    variants={variants}
                    transition={{ duration: breathPhase === 'hold' ? 2 : 4, ease: "easeInOut" }}
                    className={cn(
                        "w-24 h-24 rounded-full bg-gradient-to-br shadow-[0_0_50px_rgba(255,255,255,0.2)] border border-white/10",
                        config.color
                    )}
                />
            </div>

            {/* Instruction Text */}
            <div className="mt-12 h-8 text-center">
                <motion.span
                    key={`${breathPhase}-${mode}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-serif text-muted-foreground tracking-widest uppercase"
                >
                    {breathPhase === 'inhale' && config.inhale}
                    {breathPhase === 'hold' && "Be Still"}
                    {breathPhase === 'exhale' && config.exhale}
                </motion.span>
            </div>

            <p className="absolute bottom-8 text-xs text-muted-foreground/50">
                Sync your breath with the light
            </p>
        </div>
    );
}
