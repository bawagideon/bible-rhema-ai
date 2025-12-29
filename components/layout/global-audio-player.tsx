"use client";

import { useAudio } from "@/lib/store/audio-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, CloudRain, Music, Mic2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function GlobalAudioPlayer() {
    const { isPlaying, togglePlay, currentTrack, setTrack, volume, setVolume } = useAudio();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2",
                !isExpanded && "hover:scale-105 transition-transform"
            )}
        >
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl mb-2 w-64"
                    >
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Temple Atmosphere
                            </h3>

                            <div className="flex justify-between gap-2">
                                <Button
                                    variant={currentTrack === 'rain' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setTrack('rain')}
                                >
                                    <CloudRain className="w-4 h-4 mr-2" /> Rain
                                </Button>
                                <Button
                                    variant={currentTrack === 'harp' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setTrack('harp')}
                                >
                                    <Music className="w-4 h-4 mr-2" /> Harp
                                </Button>
                                <Button
                                    variant={currentTrack === 'chant' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setTrack('chant')}
                                >
                                    <Mic2 className="w-4 h-4 mr-2" /> Chant
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4 text-muted-foreground" />
                                <Slider
                                    value={[volume * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={(v) => setVolume(v[0] / 100)}
                                    className="flex-1"
                                />
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
                    className="h-8 px-3 rounded-full bg-background/50 backdrop-blur text-xs font-medium border border-border/50"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {currentTrack === 'rain' && "Upper Room Rain"}
                    {currentTrack === 'harp' && "David's Harp"}
                    {currentTrack === 'chant' && "Gregorian Deep"}
                    {currentTrack === 'silence' && "Silence"}
                </Button>
            </div>
        </motion.div>
    );
}
