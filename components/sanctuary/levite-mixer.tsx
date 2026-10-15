"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Sparkles, Music, Mic, Radio, ExternalLink, Play, Pause } from "lucide-react";
import { rhemaAudio } from "@/lib/audio-engine";
import { cn } from "@/lib/utils";

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const PAD_STYLES = [
    { id: "pad", label: "Soaking Pad" },
    { id: "rain", label: "Rainfall" },
    { id: "waters", label: "Still Waters" },
];

export function LeviteMixer() {
    // Fader 1: Levite Pad
    const [padKey, setPadKey] = useState("C");
    const [padStyle, setPadStyle] = useState("pad");
    const [padVolume, setPadVolume] = useState(0.6);
    const [isPadPlaying, setIsPadPlaying] = useState(false);

    // Fader 2: Scripture Voice
    const [voiceVolume, setVoiceVolume] = useState(0.8);
    const [isDucking, setIsDucking] = useState(true);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);

    // Fader 3: Worship Playlist
    const [worshipVolume, setWorshipVolume] = useState(0.4);
    const [playlistUrl, setPlaylistUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO");
    const [customUrlInput, setCustomUrlInput] = useState("");
    const [showUrlEditor, setShowUrlEditor] = useState(false);

    // Timer & Session
    const [timerMinutes, setTimerMinutes] = useState(15);
    const [fadeOutAtEnd, setFadeOutAtEnd] = useState(true);

    // Handle Pad Play/Pause
    const togglePadPlay = () => {
        if (!rhemaAudio) return;
        if (isPadPlaying) {
            rhemaAudio.stop();
            setIsPadPlaying(false);
        } else {
            rhemaAudio.play(padStyle, padVolume, padKey);
            rhemaAudio.setDucking(isDucking && isVoicePlaying);
            setIsPadPlaying(true);
        }
    };

    // Update Pad Key
    const handleKeyChange = (key: string) => {
        setPadKey(key);
        if (isPadPlaying && rhemaAudio) {
            rhemaAudio.setKey(key);
        }
    };

    // Update Pad Style
    const handleStyleChange = (style: string) => {
        setPadStyle(style);
        if (isPadPlaying && rhemaAudio) {
            rhemaAudio.play(style, padVolume, padKey);
        }
    };

    // Update Pad Volume
    const handlePadVolumeChange = (val: number) => {
        setPadVolume(val);
        if (isPadPlaying && rhemaAudio) {
            rhemaAudio.setVolume(val);
        }
    };

    // Toggle Ducking
    const handleDuckingToggle = (enabled: boolean) => {
        setIsDucking(enabled);
        if (rhemaAudio) {
            rhemaAudio.setDucking(enabled && isVoicePlaying);
        }
    };

    // Voice Play Toggle (Mock/Bible Brain)
    const toggleVoicePlay = () => {
        const next = !isVoicePlaying;
        setIsVoicePlaying(next);
        if (rhemaAudio && isDucking) {
            rhemaAudio.setDucking(next);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 p-6 bg-[#101014] border border-gray-800/80 rounded-3xl shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/60 pb-5">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase tracking-widest mb-1.5">
                        <Sparkles className="w-3 h-3" />
                        Levite Audio Engine · 3-Fader Mixer
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white tracking-tight">Scripture Soak & Prayer Atmosphere</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Balance procedural prayer pads, narrated Scripture voice, and personal worship playlists.
                    </p>
                </div>

                {/* Master / Pad Play Action */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={togglePadPlay}
                        className={cn(
                            "h-11 px-5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-lg transition-all",
                            isPadPlaying
                                ? "bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-amber-500/30"
                                : "bg-[#D4AF37] text-black hover:bg-[#b5952f]"
                        )}
                    >
                        {isPadPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        <span>{isPadPlaying ? "Pause Levite Pad" : "Start Levite Pad"}</span>
                    </Button>
                </div>
            </div>

            {/* 3 FADERS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* FADER 1: LEVITE PAD */}
                <div className="bg-[#15151a] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                                <Music className="w-3.5 h-3.5" /> Fader 1: Levite Pad
                            </span>
                            <span className="text-xs font-mono font-semibold text-foreground">
                                {Math.round(padVolume * 100)}%
                            </span>
                        </div>

                        {/* Volume Slider */}
                        <div className="py-2">
                            <Slider
                                value={[padVolume * 100]}
                                max={100}
                                step={1}
                                onValueChange={(val) => handlePadVolumeChange(val[0] / 100)}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* Musical Key Picker (C to B) */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Harmonic Key (432Hz Standard)
                            </label>
                            <div className="grid grid-cols-7 gap-1">
                                {KEYS.map((k) => (
                                    <button
                                        key={k}
                                        onClick={() => handleKeyChange(k)}
                                        className={cn(
                                            "h-8 rounded-lg text-xs font-mono font-bold transition-all",
                                            padKey === k
                                                ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                                                : "bg-[#1f1f26] text-muted-foreground hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pad Style Selector */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Ambient Soundscape
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {PAD_STYLES.map((st) => (
                                    <button
                                        key={st.id}
                                        onClick={() => handleStyleChange(st.id)}
                                        className={cn(
                                            "p-2 rounded-lg text-[11px] font-medium transition-all text-center",
                                            padStyle === st.id
                                                ? "bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold"
                                                : "bg-[#1f1f26] border border-transparent text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 italic border-t border-gray-800/60 pt-3">
                        Procedural Web Audio synthesis. Offline safe & zero bandwidth.
                    </div>
                </div>

                {/* FADER 2: SCRIPTURE VOICE */}
                <div className="bg-[#15151a] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5" /> Fader 2: Scripture Voice
                            </span>
                            <span className="text-xs font-mono font-semibold text-foreground">
                                {Math.round(voiceVolume * 100)}%
                            </span>
                        </div>

                        {/* Volume Slider */}
                        <div className="py-2">
                            <Slider
                                value={[voiceVolume * 100]}
                                max={100}
                                step={1}
                                onValueChange={(val) => setVoiceVolume(val[0] / 100)}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* Voice Controls */}
                        <div className="p-3 rounded-xl bg-[#1b1b22] border border-gray-800/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white">Narrated Passage</span>
                                <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 uppercase">
                                    Bible Brain API
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                "Be still, and know that I am God: I will be exalted among the heathen..."
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={toggleVoicePlay}
                                className="w-full text-xs h-8 border-gray-700 bg-black/40 text-gray-200 hover:text-white"
                            >
                                {isVoicePlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                                {isVoicePlaying ? "Pause Scripture Narration" : "Play Scripture Voice"}
                            </Button>
                        </div>

                        {/* Auto-Ducking Toggle */}
                        <div className="p-3 rounded-xl bg-[#1a1a22] border border-gray-800 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <label className="text-xs font-semibold text-white block cursor-pointer">
                                    Automatic Ducking
                                </label>
                                <span className="text-[10px] text-muted-foreground block">
                                    Lower the pad while voice speaks
                                </span>
                            </div>
                            <Switch
                                checked={isDucking}
                                onCheckedChange={handleDuckingToggle}
                            />
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 italic border-t border-gray-800/60 pt-3">
                        Public domain dramatized voice audio with auto-ducking.
                    </div>
                </div>

                {/* FADER 3: WORSHIP PLAYLIST */}
                <div className="bg-[#15151a] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5" /> Fader 3: Worship Stream
                            </span>
                            <span className="text-xs font-mono font-semibold text-foreground">
                                {Math.round(worshipVolume * 100)}%
                            </span>
                        </div>

                        {/* Volume Slider */}
                        <div className="py-2">
                            <Slider
                                value={[worshipVolume * 100]}
                                max={100}
                                step={1}
                                onValueChange={(val) => setWorshipVolume(val[0] / 100)}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* Playlist Embed / Mobile Link */}
                        <div className="space-y-3">
                            <div className="hidden md:block rounded-xl overflow-hidden border border-gray-800/80 bg-black">
                                <iframe
                                    src={playlistUrl}
                                    width="100%"
                                    height="152"
                                    frameBorder="0"
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                    className="rounded-xl"
                                />
                            </div>

                            {/* Mobile "Open in Spotify" button (PDF spec) */}
                            <div className="md:hidden">
                                <a
                                    href="https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button className="w-full bg-[#1DB954] hover:bg-[#1aa34a] text-black font-semibold text-xs h-10 gap-2">
                                        <ExternalLink className="w-4 h-4" />
                                        Open in Spotify
                                    </Button>
                                </a>
                            </div>

                            <button
                                onClick={() => setShowUrlEditor(!showUrlEditor)}
                                className="text-[11px] text-[#D4AF37] hover:underline block text-left"
                            >
                                {showUrlEditor ? "Hide embed link" : "Change playlist URL (Spotify / YouTube / Audiomack)"}
                            </button>

                            {showUrlEditor && (
                                <div className="space-y-2 pt-1 animate-in fade-in duration-300">
                                    <input
                                        type="text"
                                        placeholder="Paste Spotify embed URL..."
                                        value={customUrlInput}
                                        onChange={(e) => setCustomUrlInput(e.target.value)}
                                        className="w-full text-xs p-2 rounded-lg bg-black/60 border border-gray-700 text-white placeholder:text-gray-500"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            if (customUrlInput.trim()) {
                                                setPlaylistUrl(customUrlInput.trim());
                                                setShowUrlEditor(false);
                                            }
                                        }}
                                        className="text-xs h-7 bg-[#D4AF37] text-black hover:bg-[#b5952f]"
                                    >
                                        Apply URL
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 italic border-t border-gray-800/60 pt-3">
                        Desktop inline player & mobile Spotify companion deep-link.
                    </div>
                </div>

            </div>

            {/* SESSION TIMER & FADE OUT AT END (PDF SPEC) */}
            <div className="p-4 rounded-2xl bg-[#141418] border border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Session Duration:
                    </span>
                    <div className="flex items-center gap-1.5">
                        {[5, 10, 15, 20, 30].map((mins) => (
                            <button
                                key={mins}
                                onClick={() => setTimerMinutes(mins)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all",
                                    timerMinutes === mins
                                        ? "bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20"
                                        : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
                                )}
                            >
                                {mins}m
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Fade out at the end</span>
                    <Switch
                        checked={fadeOutAtEnd}
                        onCheckedChange={setFadeOutAtEnd}
                    />
                </div>
            </div>
        </div>
    );
}
