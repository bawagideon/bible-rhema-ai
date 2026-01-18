"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Play, Pause, Timer, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAudio } from "@/lib/store/audio-context";

interface PrayerFocusModalProps {
    isOpen: boolean;
    onClose: () => void;
    prayer: {
        id: string;
        title: string;
        ai_strategy?: string;
        scripture_ref?: string;
    } | null;
}

export function PrayerFocusModal({ isOpen, onClose, prayer }: PrayerFocusModalProps) {
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes default
    const [isActive, setIsActive] = useState(false);
    const { playTrack, currentTrackId } = useAudio();

    // Reset timer when prayer changes
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(120);
            setIsActive(false);
        }
    }, [isOpen, prayer]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        if (!isActive) {
            // Start "Warfare" or "Worship" music if not playing
            // playTrack('harp'); // Optional: force a specific track
        }
        setIsActive(!isActive);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!prayer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl bg-card border-[#D4AF37]/20 p-0 overflow-hidden gap-0">
                {/* Header Image / Gradient */}
                <div className="h-32 bg-gradient-to-r from-[#D4AF37]/20 via-primary/10 to-background relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                    <Sparkles className="w-12 h-12 text-[#D4AF37] opacity-20 absolute top-4 right-4 animate-pulse" />

                    <h2 className="relative z-10 text-2xl md:text-3xl font-serif font-bold text-center px-6 leading-tight">
                        {prayer.title}
                    </h2>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Strategy Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                            <Sparkles className="w-4 h-4" />
                            Divine Strategy
                        </div>
                        <div className="bg-muted/30 rounded-lg p-5 border border-border/50 text-muted-foreground leading-relaxed text-sm md:text-base">
                            {prayer.ai_strategy || "Wait on the Lord, and He shall renew your strength. Pray in the Spirit until the strategy is revealed."}
                        </div>

                        {prayer.scripture_ref && (
                            <div className="text-center">
                                <span className="font-serif italic text-primary text-lg">"{prayer.scripture_ref}"</span>
                            </div>
                        )}
                    </div>

                    {/* Timer Focus Area */}
                    <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-xl border border-border/50">
                        <div className="text-4xl font-mono font-light tracking-widest text-[#D4AF37] mb-4">
                            {formatTime(timeLeft)}
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                size="lg"
                                className={cn(
                                    "min-w-[140px] font-semibold tracking-wide",
                                    isActive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-[#D4AF37] text-black hover:bg-[#b5952f]"
                                )}
                                onClick={toggleTimer}
                            >
                                {isActive ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-2" /> Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" /> Pray Now
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            {isActive ? "Interceding..." : "Set a 2-minute timer for focused prayer."}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
