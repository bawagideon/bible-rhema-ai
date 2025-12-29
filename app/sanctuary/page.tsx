"use client";

import { BreathingOrb } from "@/components/sanctuary/breathing-orb";
import { ScriptureSoak } from "@/components/sanctuary/scripture-soak";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SanctuaryPage() {
    const [isMuted, setIsMuted] = useState(true);

    return (
        <div className="relative h-full w-full bg-background overflow-hidden flex flex-col">
            {/* Ambient Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-black/40" />
                {/* Could add a subtle slow-moving background video/gradient mesh here */}
            </div>

            {/* Audio Control (Top Right) */}
            <div className="absolute top-6 right-6 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(prev => !prev)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
                {/* The Scripture Text (Background Layer) */}
                <div className="absolute inset-0 flex items-center justify-center z-0 scale-90 md:scale-100">
                    <ScriptureSoak />
                </div>

                {/* The Breathing Orb (Foreground Focus) */}
                <div className="relative z-20 mt-32 md:mt-0">
                    <BreathingOrb />
                </div>
            </main>
        </div>
    );
}
