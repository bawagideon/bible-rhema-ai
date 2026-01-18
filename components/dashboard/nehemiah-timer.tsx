"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Hammer, Music, BrainCircuit } from "lucide-react";
import { useAudio } from "@/lib/store/audio-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type TimerMode = 'build' | 'spirit';

export function NehemiahTimer({ heroMode = false }: { heroMode?: boolean }) {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<TimerMode>('build');
    const { playTrack, currentTrackId } = useAudio();

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play a notification sound here?
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        if (!isActive) {
            // Auto-play appropriate track
            if (mode === 'build' && currentTrackId !== 'lofi') {
                playTrack('lofi');
            } else if (mode === 'spirit' && currentTrackId !== 'harp') {
                playTrack('harp');
            }
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'build' ? 25 * 60 : 10 * 60);
    };

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'build' ? 25 * 60 : 10 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'build'
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
        : ((10 * 60 - timeLeft) / (10 * 60)) * 100;

    return (
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm relative overflow-hidden">
            {/* Background Progress Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear",
                    mode === 'spirit' ? "bg-blue-500" : "bg-[#D4AF37]"
                )}
                style={{ width: `${progress}%` }}
            />

            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {mode === 'build' ? <Hammer className="w-4 h-4 text-[#D4AF37]" /> : <Music className="w-4 h-4 text-blue-500" />}
                        <h3 className="font-serif font-bold text-sm uppercase tracking-widest text-muted-foreground">
                            {mode === 'build' ? "Nehemiah Mode" : "Selah Pause"}
                        </h3>
                    </div>
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        <button
                            onClick={() => switchMode('build')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                mode === 'build' ? "bg-background shadow-sm text-[#D4AF37]" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Build Mode (25m)"
                        >
                            <BrainCircuit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => switchMode('spirit')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                mode === 'spirit' ? "bg-background shadow-sm text-blue-500" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Spirit Mode (10m)"
                        >
                            <Music className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="text-center space-y-6">
                    <div className="relative inline-block">
                        <span className={cn(
                            "text-5xl font-mono font-light tracking-widest tabular-nums",
                            isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {formatTime(timeLeft)}
                        </span>
                        {isActive && (
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -right-4 top-2 w-2 h-2 rounded-full bg-red-500"
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <Button
                            size="lg"
                            className={cn(
                                "min-w-[120px] font-semibold",
                                mode === 'spirit' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" : "bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20"
                            )}
                            onClick={toggleTimer}
                        >
                            {isActive ? (
                                <>
                                    <Pause className="w-4 h-4 mr-2" /> Pause
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" /> Start
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetTimer}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
