"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { SOUNDSCAPES, Soundscape } from "@/lib/audio-assets";

interface AudioContextType {
    isPlaying: boolean;
    currentTrackId: string | null;
    currentTrack: Soundscape | null;
    volume: number;
    togglePlay: () => void;
    playTrack: (trackId: string) => void;
    setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackId, setCurrentTrackId] = useState<string | null>('rain'); // Default
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Derived state
    const currentTrack = currentTrackId ? SOUNDSCAPES.find(s => s.id === currentTrackId) || null : null;

    useEffect(() => {
        if (!audioRef.current || !currentTrack) return;

        // Only update source if it changed to avoid reloading same track
        const source = currentTrack.url;
        if (audioRef.current.src !== source) {
            audioRef.current.src = source;
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
            }
        }
    }, [currentTrack]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const playTrack = (trackId: string) => {
        if (trackId === currentTrackId && isPlaying) return; // Already playing
        setCurrentTrackId(trackId);
        setIsPlaying(true);
    };

    return (
        <AudioContext.Provider value={{
            isPlaying,
            currentTrackId,
            currentTrack,
            volume,
            togglePlay: () => setIsPlaying(prev => !prev),
            playTrack,
            setVolume
        }}>
            <audio ref={audioRef} loop />
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
}
