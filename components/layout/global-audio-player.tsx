"use client";

import { useAudio } from "@/lib/store/audio-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, CloudRain, Music, Mic2, ListMusic, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SOUNDSCAPES } from "@/lib/audio-assets";

export function GlobalAudioPlayer() {
    const { isPlaying, togglePlay, currentTrack, currentTrackId, playTrack, volume, setVolume } = useAudio();
    const [isExpanded, setIsExpanded] = useState(false);

    const getIcon = (category: string) => {
        switch (category) {
            case 'nature': return <CloudRain className="w-4 h-4" />;
            case 'worship': return <Mic2 className="w-4 h-4" />;
            case 'focus': return <BrainCircuit className="w-4 h-4" />;
            default: return <Music className="w-4 h-4" />;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 isolate",
                // Ensure it stays above other elements even in immersive mode
            )}
        >
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl mb-2 w-[300px]"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Levite Engine
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-3 h-3 text-muted-foreground" />
                                    <Slider
                                        value={[volume * 100]}
                                        max={100}
                                        step={1}
                                        onValueChange={(v) => setVolume(v[0] / 100)}
                                        className="w-20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {SOUNDSCAPES.map((track) => (
                                    <button
                                        key={track.id}
                                        onClick={() => playTrack(track.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors border border-transparent",
                                            currentTrackId === track.id
                                                ? "bg-primary/10 border-primary/20 text-primary"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            currentTrackId === track.id ? "bg-primary/20" : "bg-muted"
                                        )}>
                                            {getIcon(track.category)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-semibold truncate">{track.name}</p>
                                            <p className="text-[10px] opacity-70 truncate">{track.description}</p>
                                        </div>
                                        {currentTrackId === track.id && isPlaying && (
                                            <div className="flex space-x-[2px] h-3 items-end">
                                                <motion.div animate={{ height: [2, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-primary" />
                                                <motion.div animate={{ height: [4, 12, 2] }} transition={{ repeat: Infinity, duration: 1.1 }} className="w-0.5 bg-primary" />
                                                <motion.div animate={{ height: [2, 8, 4] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-0.5 bg-primary" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "rounded-full h-12 w-12 border-primary/20 bg-background/80 backdrop-blur shadow-lg transition-all",
                        isPlaying && "border-[#D4AF37] shadow-[#D4AF37]/20"
                    )}
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause className={cn("w-5 h-5", isPlaying && "text-[#D4AF37]")} /> : <Play className="w-5 h-5 ml-1" />}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-full bg-background/50 backdrop-blur text-xs font-medium border border-border/50 gap-2 overflow-hidden max-w-[150px]"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <ListMusic className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">
                        {currentTrack?.name || "Select Atmosphere"}
                    </span>
                </Button>
            </div>
        </motion.div>
    );
}
