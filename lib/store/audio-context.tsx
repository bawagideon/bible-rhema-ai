"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";

type AudioTrack = "rain" | "harp" | "chant" | "silence";

interface AudioContextType {
    isPlaying: boolean;
    currentTrack: AudioTrack;
    volume: number;
    togglePlay: () => void;
    setTrack: (track: AudioTrack) => void;
    setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// MOCK ASSETS - Replace with real URLs
const TRACKS: Record<AudioTrack, string> = {
    rain: "https://cdn.pixabay.com/download/audio/2022/07/04/audio_3497274070.mp3?filename=rain-and-thunder-113222.mp3", // Placeholder
    harp: "https://cdn.pixabay.com/download/audio/2022/03/09/audio_6c2f9e422c.mp3?filename=angelic-pad-10886.mp3", // Placeholder
    chant: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=gregorian-chant-1-6597.mp3", // Placeholder
    silence: ""
};

export function AudioProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<AudioTrack>("rain");
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!audioRef.current) return;

        audioRef.current.volume = volume;

        if (currentTrack === 'silence') {
            audioRef.current.pause();
            return;
        }

        audioRef.current.src = TRACKS[currentTrack];
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        } else {
            audioRef.current.pause();
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            currentTrack,
            volume,
            togglePlay: () => setIsPlaying(prev => !prev),
            setTrack: setCurrentTrack,
            setVolume: setVolume
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
