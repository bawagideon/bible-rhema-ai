"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function BreathingOrb() {
    const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

    useEffect(() => {
        const breathe = async () => {
            while (true) {
                setBreathPhase("inhale");
                await new Promise(r => setTimeout(r, 4000));

                setBreathPhase("hold");
                await new Promise(r => setTimeout(r, 2000));

                setBreathPhase("exhale");
                await new Promise(r => setTimeout(r, 4000));

                // Small pause before next cycle
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

    const textVariants = {
        inhale: { opacity: 1, y: 0 },
        hold: { opacity: 1, y: 0 },
        exhale: { opacity: 0, y: 10 }
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
                    className="absolute w-48 h-48 rounded-full bg-primary/20 blur-3xl"
                />
                <motion.div
                    animate={breathPhase}
                    variants={variants}
                    transition={{ duration: breathPhase === 'hold' ? 2 : 4, ease: "easeInOut" }}
                    className="absolute w-32 h-32 rounded-full bg-[#D4AF37]/30 blur-2xl"
                />

                {/* Core */}
                <motion.div
                    animate={breathPhase}
                    variants={variants}
                    transition={{ duration: breathPhase === 'hold' ? 2 : 4, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8A6E24] shadow-[0_0_50px_rgba(212,175,55,0.4)] border border-[#D4AF37]/50"
                />
            </div>

            {/* Instruction Text */}
            <div className="mt-12 h-8 text-center">
                <motion.span
                    key={breathPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-serif text-muted-foreground tracking-widest uppercase"
                >
                    {breathPhase === 'inhale' && "Inhale Grace"}
                    {breathPhase === 'hold' && "Be Still"}
                    {breathPhase === 'exhale' && "Release Worry"}
                </motion.span>
            </div>

            <p className="absolute bottom-8 text-xs text-muted-foreground/50">
                Sync your breath with the light
            </p>
        </div>
    );
}
