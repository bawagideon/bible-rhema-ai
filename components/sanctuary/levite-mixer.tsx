"use client";

import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Sparkles, Music, Mic, Radio, ExternalLink, Play, Pause, Bookmark, Check, Info } from "lucide-react";
import { rhemaAudio } from "@/lib/audio-engine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const PAD_STYLES = [
    { id: "pad", label: "Soaking Pad" },
    { id: "rain", label: "Rainfall" },
    { id: "waters", label: "Still Waters" },
];

export interface ScripturePassageOption {
    id: string;
    ref: string;
    title: string;
    text: string;
}

export const SCRIPTURE_PASSAGES: ScripturePassageOption[] = [
    {
        id: "psalm-23",
        ref: "Psalm 23:1-6",
        title: "The Good Shepherd",
        text: "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake. Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me. Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over. Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever."
    },
    {
        id: "psalm-46",
        ref: "Psalm 46:1-10",
        title: "Be Still and Know",
        text: "God is our refuge and strength, a very present help in trouble. Therefore will not we fear, though the earth be removed, and though the mountains be carried into the midst of the sea. There is a river, the streams whereof shall make glad the city of God, the holy place of the tabernacles of the most High. God is in the midst of her; she shall not be moved: God shall help her, and that right early. Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth. The Lord of hosts is with us; the God of Jacob is our refuge."
    },
    {
        id: "psalm-91",
        ref: "Psalm 91:1-6",
        title: "The Secret Place",
        text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the Lord, He is my refuge and my fortress: my God; in him will I trust. Surely he shall deliver thee from the snare of the fowler, and from the noisome pestilence. He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler. Thou shalt not be afraid for the terror by night; nor for the arrow that flieth by day."
    },
    {
        id: "john-15",
        ref: "John 15:1-8",
        title: "The True Vine",
        text: "I am the true vine, and my Father is the husbandman. Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit. Now ye are clean through the word which I have spoken unto you. Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me. I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing."
    },
    {
        id: "romans-8",
        ref: "Romans 8:31-39",
        title: "More Than Conquerors",
        text: "What shall we then say to these things? If God be for us, who can be against us? He that spared not his own Son, but delivered him up for us all, how shall he not with him also freely give us all things? Who shall separate us from the love of Christ? shall tribulation, or distress, or persecution, or famine, or nakedness, or peril, or sword? Nay, in all these things we are more than conquerors through him that loved us. For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."
    }
];

interface MixPreset {
    id: string;
    name: string;
    padStyle: string;
    padKey: string;
    padVolume: number;
    passageId: string;
    voiceVolume: number;
    isDucking: boolean;
}

const DEFAULT_PRESETS: MixPreset[] = [
    {
        id: "secret-place",
        name: "Secret Place",
        padStyle: "pad",
        padKey: "C",
        padVolume: 0.7,
        passageId: "psalm-91",
        voiceVolume: 0.85,
        isDucking: true
    },
    {
        id: "morning-watch",
        name: "Morning Watch",
        padStyle: "waters",
        padKey: "G",
        padVolume: 0.55,
        passageId: "psalm-23",
        voiceVolume: 0.8,
        isDucking: true
    },
    {
        id: "midnight-intercession",
        name: "Midnight Cry",
        padStyle: "rain",
        padKey: "D",
        padVolume: 0.65,
        passageId: "romans-8",
        voiceVolume: 0.9,
        isDucking: true
    }
];

export function LeviteMixer() {
    // Fader 1: Levite Pad
    const [padKey, setPadKey] = useState("C");
    const [padStyle, setPadStyle] = useState("pad");
    const [padVolume, setPadVolume] = useState(0.6);
    const [isPadPlaying, setIsPadPlaying] = useState(false);

    // Fader 2: Scripture Voice (Real Web Speech API Narration)
    const [voiceVolume, setVoiceVolume] = useState(0.85);
    const [selectedPassageId, setSelectedPassageId] = useState("psalm-23");
    const [isDucking, setIsDucking] = useState(true);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Fader 3: Worship Playlist
    const [worshipVolume, setWorshipVolume] = useState(0.4);
    const [playlistUrl, setPlaylistUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO");
    const [customUrlInput, setCustomUrlInput] = useState("");
    const [showUrlEditor, setShowUrlEditor] = useState(false);

    // Timer & Session
    const [timerMinutes, setTimerMinutes] = useState(15);
    const [fadeOutAtEnd, setFadeOutAtEnd] = useState(true);

    // Presets
    const [activePreset, setActivePreset] = useState<string>("secret-place");

    const selectedPassage = SCRIPTURE_PASSAGES.find(p => p.id === selectedPassageId) || SCRIPTURE_PASSAGES[0];

    // Check Speech Synthesis capability
    useEffect(() => {
        if (typeof window !== "undefined") {
            setSpeechSupported('speechSynthesis' in window);
        }
        return () => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

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

    // Real Scripture Speech Synthesis
    const stopScriptureVoice = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsVoicePlaying(false);
        if (rhemaAudio) {
            rhemaAudio.setDucking(false);
        }
    };

    const startScriptureVoice = (passageToSpeak = selectedPassage) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            toast.error("Speech Synthesis is not supported in this browser.");
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(passageToSpeak.text);
        utterance.volume = voiceVolume;
        utterance.rate = 0.88; // Reverent, gentle, calm pace
        utterance.pitch = 0.95;

        // Choose a calm English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Daniel") || v.name.includes("Samantha"))
        ) || voices.find(v => v.lang.startsWith("en"));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            setIsVoicePlaying(true);
            if (rhemaAudio && isDucking) {
                rhemaAudio.setDucking(true);
            }
        };

        utterance.onend = () => {
            setIsVoicePlaying(false);
            if (rhemaAudio) {
                rhemaAudio.setDucking(false);
            }
        };

        utterance.onerror = (e) => {
            console.warn("Scripture voice playback stopped or interrupted:", e);
            setIsVoicePlaying(false);
            if (rhemaAudio) {
                rhemaAudio.setDucking(false);
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const toggleVoicePlay = () => {
        if (isVoicePlaying) {
            stopScriptureVoice();
        } else {
            startScriptureVoice();
        }
    };

    // Update voice volume live
    const handleVoiceVolumeChange = (vol: number) => {
        setVoiceVolume(vol);
        if (isVoicePlaying) {
            // Re-apply to ongoing speech
            stopScriptureVoice();
            setTimeout(() => {
                startScriptureVoice();
            }, 50);
        }
    };

    // Switch Scripture Passage
    const handlePassageSelect = (id: string) => {
        setSelectedPassageId(id);
        const next = SCRIPTURE_PASSAGES.find(p => p.id === id);
        if (isVoicePlaying && next) {
            stopScriptureVoice();
            setTimeout(() => {
                startScriptureVoice(next);
            }, 100);
        }
    };

    // Load Mix Preset
    const applyPreset = (preset: MixPreset) => {
        setActivePreset(preset.id);
        setPadStyle(preset.padStyle);
        setPadKey(preset.padKey);
        setPadVolume(preset.padVolume);
        setSelectedPassageId(preset.passageId);
        setVoiceVolume(preset.voiceVolume);
        setIsDucking(preset.isDucking);

        if (isPadPlaying && rhemaAudio) {
            rhemaAudio.play(preset.padStyle, preset.padVolume, preset.padKey);
        }

        toast.success(`Applied preset: ${preset.name}`);
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

            {/* Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#141418] border border-gray-800/80">
                <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-white">Atmosphere Presets:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {DEFAULT_PRESETS.map((pr) => (
                        <button
                            key={pr.id}
                            onClick={() => applyPreset(pr)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                                activePreset === pr.id
                                    ? "bg-[#D4AF37] text-black font-semibold shadow-sm"
                                    : "bg-[#1c1c22] border border-gray-800 text-gray-300 hover:text-white"
                            )}
                        >
                            {activePreset === pr.id && <Check className="w-3 h-3" />}
                            {pr.name}
                        </button>
                    ))}
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

                {/* FADER 2: SCRIPTURE VOICE (REAL LIVE NARRATION) */}
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
                                onValueChange={(val) => handleVoiceVolumeChange(val[0] / 100)}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* Passage Selection Dropdown / Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Select Scripture Passage
                            </label>
                            <select
                                value={selectedPassageId}
                                onChange={(e) => handlePassageSelect(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg bg-[#1b1b22] border border-gray-800 text-white font-medium focus:border-blue-500 focus:outline-none"
                            >
                                {SCRIPTURE_PASSAGES.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-[#141416] text-white">
                                        {p.ref} · {p.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Voice Controls with Real Playback */}
                        <div className="p-3 rounded-xl bg-[#1b1b22] border border-gray-800/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white">{selectedPassage.ref}</span>
                                <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 uppercase">
                                    Web Speech API
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-3 italic">
                                "{selectedPassage.text}"
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={toggleVoicePlay}
                                className={cn(
                                    "w-full text-xs h-8 border-gray-700 transition-colors",
                                    isVoicePlaying
                                        ? "bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30"
                                        : "bg-black/40 text-gray-200 hover:text-white"
                                )}
                            >
                                {isVoicePlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                                {isVoicePlaying ? "Pause Scripture Narration" : "Read Scripture Aloud"}
                            </Button>
                        </div>

                        {/* Auto-Ducking Toggle */}
                        <div className="p-3 rounded-xl bg-[#1a1a22] border border-gray-800 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <label className="text-xs font-semibold text-white block cursor-pointer">
                                    Automatic Ducking
                                </label>
                                <span className="text-[10px] text-muted-foreground block">
                                    Ducks procedural pad to 35% when voice speaks
                                </span>
                            </div>
                            <Switch
                                checked={isDucking}
                                onCheckedChange={handleDuckingToggle}
                            />
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 italic border-t border-gray-800/60 pt-3">
                        Local client-side speech synthesis with real-time pad ducking.
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
                                External
                            </span>
                        </div>

                        {/* Honest Embed Disclaimer (Audit finding) */}
                        <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>
                                External playlist embeds (Spotify / YouTube) control volume within their player widget due to browser sandbox security.
                            </span>
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

                            {/* Mobile "Open in Spotify" button */}
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
                                                toast.success("Updated worship stream URL");
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

            {/* SESSION TIMER & FADE OUT AT END */}
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
