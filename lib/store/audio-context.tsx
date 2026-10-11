"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { SOUNDSCAPES, Soundscape } from "@/lib/audio-assets";
import { rhemaAudio } from "@/lib/audio-engine";

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
    const [currentTrackId, setCurrentTrackId] = useState<string | null>('rain');
    const [volume, setVolumeState] = useState(0.5);

    const currentTrack = currentTrackId ? SOUNDSCAPES.find(s => s.id === currentTrackId) || SOUNDSCAPES[0] : null;

    useEffect(() => {
        if (!rhemaAudio) return;

        if (isPlaying && currentTrackId) {
            rhemaAudio.play(currentTrackId, volume);
        } else {
            rhemaAudio.stop();
        }

        return () => {
            if (rhemaAudio) rhemaAudio.stop();
        };
    }, [isPlaying, currentTrackId]);

    const setVolume = (vol: number) => {
        setVolumeState(vol);
        if (rhemaAudio) {
            rhemaAudio.setVolume(vol);
        }
    };

    const playTrack = (trackId: string) => {
        if (trackId === currentTrackId && isPlaying) {
            setIsPlaying(false);
            return;
        }
        setCurrentTrackId(trackId);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    return (
        <AudioContext.Provider value={{
            isPlaying,
            currentTrackId,
            currentTrack,
            volume,
            togglePlay,
            playTrack,
            setVolume
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
}
