"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Music, BookOpen, Volume2, Pause } from "lucide-react";
import { useAudio } from "@/lib/store/audio-context";
import { JournalModal } from "@/components/journal/journal-modal";

export function EveningSacrifice() {
    const { isPlaying, playTrack, togglePlay, currentTrackId } = useAudio();
    const [isJournalOpen, setIsJournalOpen] = useState(false);

    const isSleepSoundsPlaying = isPlaying && currentTrackId === 'rain';

    const handleSleepSounds = () => {
        if (isSleepSoundsPlaying) {
            togglePlay();
        } else {
            playTrack('rain');
        }
    };

    return (
        <>
            <Card className="border-border/60 bg-gradient-to-br from-indigo-950/40 to-background backdrop-blur-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-05 mix-blend-overlay pointer-events-none" />

                <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold tracking-wider uppercase">
                            <Moon className="w-3 h-3" />
                            Evening Sacrifice
                        </div>

                        <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
                            The day is done.<br />
                            <span className="text-muted-foreground">Return to rest.</span>
                        </h2>

                        <p className="text-muted-foreground max-w-md">
                            "I will lie down in peace and sleep, for you alone, O Lord, make me dwell in safety." — Psalm 4:8
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[200px]">
                        <Button
                            size="lg"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
                            onClick={() => setIsJournalOpen(true)}
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Reflect & Journal
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className={`w-full border-indigo-500/30 transition-all ${isSleepSoundsPlaying ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400' : 'hover:bg-indigo-500/10 hover:text-indigo-300'}`}
                            onClick={handleSleepSounds}
                        >
                            {isSleepSoundsPlaying ? (
                                <>
                                    <Pause className="w-4 h-4 mr-2 text-indigo-400 animate-pulse" />
                                    Pause Rain Sounds
                                </>
                            ) : (
                                <>
                                    <Music className="w-4 h-4 mr-2" />
                                    Sleep Sounds (Latter Rain)
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <JournalModal
                isOpen={isJournalOpen}
                onClose={() => setIsJournalOpen(false)}
                initialTitle="Evening Reflection"
                initialScripture="Psalm 4:8"
            />
        </>
    );
}
