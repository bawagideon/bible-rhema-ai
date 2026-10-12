"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/brand/brand-logo";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Clock,
    Wind,
    BookOpen,
    Headphones,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Sparkles,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAudio } from "@/lib/store/audio-context";
import { SOUNDSCAPES } from "@/lib/audio-assets";
import { BreathingOrb } from "@/components/sanctuary/breathing-orb";

const SANCTUARY_SCRIPTURES = [
    {
        ref: "Psalm 46:10",
        translation: "ESV",
        theme: "Peace",
        text: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!"
    },
    {
        ref: "Matthew 11:28-29",
        translation: "ESV",
        theme: "Rest",
        text: "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls."
    },
    {
        ref: "Philippians 4:6-7",
        translation: "ESV",
        theme: "Overcoming Anxiety",
        text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus."
    },
    {
        ref: "Isaiah 26:3",
        translation: "ESV",
        theme: "Steadfast Trust",
        text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you."
    },
    {
        ref: "John 14:27",
        translation: "ESV",
        theme: "Christ's Peace",
        text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid."
    },
    {
        ref: "Romans 8:38-39",
        translation: "ESV",
        theme: "Unfailing Love",
        text: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come... will be able to separate us from the love of God in Christ Jesus our Lord."
    }
];

export default function SanctuaryPage() {
    const [activeRoom, setActiveRoom] = useState<"stillness" | "soak" | "ambient">("stillness");
    const [scriptureIndex, setScriptureIndex] = useState(0);
    const [showGuidance, setShowGuidance] = useState(true);
    const [timerMinutes, setTimerMinutes] = useState<number>(10);
    const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const { isPlaying, currentTrackId, currentTrack, volume, togglePlay, playTrack, setVolume } = useAudio();

    // Timer countdown
    useEffect(() => {
        if (!isTimerRunning || secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining(prev => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    // Pause audio when session timer completes
                    if (isPlaying) togglePlay();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimerRunning, secondsRemaining, isPlaying, togglePlay]);

    const handleSelectTimer = (minutes: number) => {
        setTimerMinutes(minutes);
        setSecondsRemaining(minutes * 60);
        setIsTimerRunning(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentScripture = SANCTUARY_SCRIPTURES[scriptureIndex];

    const handleNextScripture = () => {
        setScriptureIndex((prev) => (prev + 1) % SANCTUARY_SCRIPTURES.length);
    };

    const handlePrevScripture = () => {
        setScriptureIndex((prev) => (prev - 1 + SANCTUARY_SCRIPTURES.length) % SANCTUARY_SCRIPTURES.length);
    };

    return (
        <div className="relative h-screen w-full bg-[#0a0a0c] text-foreground overflow-hidden flex flex-col justify-between selection:bg-[#D4AF37]/20">
            {/* Ambient Background Gradient Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[140px]" />
                <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-900/10 rounded-full blur-[160px]" />
            </div>

            {/* TOP HEADER */}
            <header className="relative z-30 h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
                {/* Brand & Exit */}
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-white hover:bg-white/5 gap-2 px-2.5 h-9"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-xs uppercase tracking-wider hidden sm:inline">Exit Sanctuary</span>
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <Link href="/" className="hidden sm:flex items-center">
                        <BrandLogo variant="primary" />
                    </Link>
                </div>

                {/* Sanctuary Room Tabs */}
                <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setActiveRoom("stillness")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            activeRoom === "stillness"
                                ? "bg-[#D4AF37] text-black font-semibold shadow-md"
                                : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <Wind className="h-3.5 w-3.5" />
                        <span>Stillness</span>
                    </button>
                    <button
                        onClick={() => setActiveRoom("soak")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            activeRoom === "soak"
                                ? "bg-[#D4AF37] text-black font-semibold shadow-md"
                                : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Scripture Soak</span>
                    </button>
                    <button
                        onClick={() => setActiveRoom("ambient")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            activeRoom === "ambient"
                                ? "bg-[#D4AF37] text-black font-semibold shadow-md"
                                : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <Headphones className="h-3.5 w-3.5" />
                        <span>Ambient Rest</span>
                    </button>
                </div>

                {/* Session Countdown */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-xs">
                        <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span className="font-mono text-[#D4AF37] font-semibold">{formatTime(secondsRemaining)}</span>
                    </div>
                </div>
            </header>

            {/* MAIN SANCTUARY STAGE */}
            <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {/* ROOM 1: THE STILLNESS ROOM */}
                    {activeRoom === "stillness" && (
                        <motion.div
                            key="stillness-room"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-8"
                        >
                            {/* Breath Orb */}
                            {showGuidance ? (
                                <div className="scale-110 md:scale-125 transform py-6">
                                    <BreathingOrb mode="default" autoStart={true} />
                                </div>
                            ) : (
                                <div className="p-12 rounded-full border border-white/10 bg-white/5 text-muted-foreground text-sm font-serif italic max-w-md">
                                    "Be still before the Lord and wait patiently for Him." — Psalm 37:7
                                </div>
                            )}

                            {/* Stillness Controls */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowGuidance(!showGuidance)}
                                    className="border-white/10 bg-black/40 hover:bg-white/10 text-xs gap-2 text-muted-foreground hover:text-white"
                                >
                                    {showGuidance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    <span>{showGuidance ? "Hide Breath Guide" : "Show Breath Guide"}</span>
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ROOM 2: SCRIPTURE SOAK ROOM */}
                    {activeRoom === "soak" && (
                        <motion.div
                            key="soak-room"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-8 max-w-2xl px-4"
                        >
                            <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 text-xs">
                                {currentScripture.theme}
                            </Badge>

                            <blockquote className="font-serif text-2xl md:text-4xl text-foreground font-normal leading-relaxed md:leading-relaxed tracking-wide drop-shadow-md">
                                “{currentScripture.text}”
                            </blockquote>

                            <div className="flex items-center gap-3">
                                <span className="font-serif text-sm md:text-base text-[#D4AF37] font-semibold tracking-wider">
                                    {currentScripture.ref} ({currentScripture.translation})
                                </span>
                            </div>

                            {/* Passage Navigator */}
                            <div className="flex items-center gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePrevScripture}
                                    className="h-9 w-9 rounded-full border-white/10 bg-black/40 hover:bg-white/10"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {scriptureIndex + 1} of {SANCTUARY_SCRIPTURES.length}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleNextScripture}
                                    className="h-9 w-9 rounded-full border-white/10 bg-black/40 hover:bg-white/10"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ROOM 3: AMBIENT WORSHIP & REST ROOM */}
                    {activeRoom === "ambient" && (
                        <motion.div
                            key="ambient-room"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-6 max-w-md w-full"
                        >
                            <div className="text-center space-y-2">
                                <h3 className="font-serif text-2xl text-foreground font-medium">Levite Sound Engine</h3>
                                <p className="text-xs text-muted-foreground">
                                    Zero-latency procedural soundscapes synthesized with restorative prayer frequencies.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                {SOUNDSCAPES.map((sc) => {
                                    const isSelected = currentTrackId === sc.id;
                                    return (
                                        <button
                                            key={sc.id}
                                            onClick={() => playTrack(sc.id)}
                                            className={cn(
                                                "p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28",
                                                isSelected && isPlaying
                                                    ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10"
                                                    : "bg-white/5 border-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs uppercase tracking-wider text-muted-foreground">{sc.category}</span>
                                                {isSelected && isPlaying && (
                                                    <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-serif font-medium text-sm text-foreground">{sc.name}</h4>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{sc.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* BOTTOM DOCK: AUDIO & TIMER CONTROLS */}
            <footer className="relative z-30 px-6 py-4 border-t border-white/5 bg-black/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                {/* Audio Track & Play Button */}
                <div className="flex items-center gap-3">
                    <Button
                        size="icon"
                        onClick={togglePlay}
                        className="h-10 w-10 rounded-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold shadow-md"
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-medium text-foreground">
                            {currentTrack?.name || "Ambient Silence"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {isPlaying ? "Playing Levite Synthesizer" : "Paused"}
                        </span>
                    </div>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 w-32 md:w-40">
                    <button onClick={() => setVolume(volume > 0 ? 0 : 0.5)} className="text-muted-foreground hover:text-white">
                        {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <Slider
                        value={[volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={(val) => setVolume(val[0] / 100)}
                        className="cursor-pointer"
                    />
                </div>

                {/* Timer Duration Switcher */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
                        Timer:
                    </span>
                    {[5, 10, 15, 20].map((mins) => (
                        <button
                            key={mins}
                            onClick={() => handleSelectTimer(mins)}
                            className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors",
                                timerMinutes === mins
                                    ? "bg-[#D4AF37] text-black font-semibold"
                                    : "bg-white/5 text-muted-foreground hover:text-white border border-white/5"
                            )}
                        >
                            {mins}m
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
}
