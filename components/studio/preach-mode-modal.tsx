"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Play, Pause, RotateCcw, X, Volume2, Type, ChevronRight,
    Maximize2, Minimize2, Clock, Sparkles
} from "lucide-react";

interface PreachModeModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    scripture: string;
    contentHtml: string;
}

export function PreachModeModal({ open, onClose, title, scripture, contentHtml }: PreachModeModalProps) {
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [scrollSpeed, setScrollSpeed] = useState<0 | 1 | 1.5 | 2>(0);
    const [fontSize, setFontSize] = useState<number>(24); // px
    const [isFullscreen, setIsFullscreen] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timer Interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (open && isTimerRunning) {
            timer = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [open, isTimerRunning]);

    // Auto-scroll engine
    useEffect(() => {
        if (!open || scrollSpeed === 0) {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
            return;
        }

        const pixelsPerTick = scrollSpeed === 1 ? 1 : scrollSpeed === 1.5 ? 2 : 3;
        const intervalDelay = scrollSpeed === 1 ? 40 : scrollSpeed === 1.5 ? 35 : 30;

        scrollIntervalRef.current = setInterval(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop += pixelsPerTick;
            }
        }, intervalDelay);

        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        };
    }, [open, scrollSpeed]);

    if (!open) return null;

    const formatTimer = (totalSec: number) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        }
    };

    const scrollToSection = (keyword: string) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const elements = container.querySelectorAll("h1, h2, h3, h4, strong");
        for (const el of Array.from(elements)) {
            if (el.textContent?.toLowerCase().includes(keyword.toLowerCase())) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#080808] text-white flex flex-col font-sans select-none">
            {/* PULPIT TELEPROMPTER TOP HUD */}
            <div className="h-16 px-6 bg-[#121214] border-b border-gray-800 flex items-center justify-between shrink-0 shadow-lg z-20">
                {/* Left: Sermon Meta & Quick Jump */}
                <div className="flex items-center gap-4">
                    <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-0 text-[10px] font-mono uppercase tracking-wider">
                        PREACH MODE · PULPIT
                    </Badge>
                    <div className="hidden md:block">
                        <span className="font-serif font-bold text-sm text-white">{title || "Untitled Manuscript"}</span>
                        {scripture && <span className="text-xs text-[#D4AF37] font-serif italic ml-2">({scripture})</span>}
                    </div>

                    {/* Section Nav Pills */}
                    <div className="hidden lg:flex items-center gap-1.5 ml-4 border-l border-gray-800 pl-4">
                        <button onClick={() => scrollToSection("intro")} className="px-2.5 py-1 text-xs rounded-md bg-[#1a1a1c] hover:bg-gray-800 text-gray-300">
                            Intro
                        </button>
                        <button onClick={() => scrollToSection("point 1")} className="px-2.5 py-1 text-xs rounded-md bg-[#1a1a1c] hover:bg-gray-800 text-gray-300">
                            Pt I
                        </button>
                        <button onClick={() => scrollToSection("point 2")} className="px-2.5 py-1 text-xs rounded-md bg-[#1a1a1c] hover:bg-gray-800 text-gray-300">
                            Pt II
                        </button>
                        <button onClick={() => scrollToSection("point 3")} className="px-2.5 py-1 text-xs rounded-md bg-[#1a1a1c] hover:bg-gray-800 text-gray-300">
                            Pt III
                        </button>
                        <button onClick={() => scrollToSection("altar")} className="px-2.5 py-1 text-xs rounded-md bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37]">
                            Altar Call
                        </button>
                    </div>
                </div>

                {/* Center: Pulpit Timer */}
                <div className="flex items-center gap-3 bg-black/60 px-4 py-1.5 rounded-full border border-gray-800">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-mono text-lg font-bold text-white tracking-widest">
                        {formatTimer(secondsElapsed)}
                    </span>
                    <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title={isTimerRunning ? "Pause timer" : "Resume timer"}
                    >
                        {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <button
                        onClick={() => setSecondsElapsed(0)}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                        title="Reset timer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Right: Teleprompter Controls & Close */}
                <div className="flex items-center gap-3">
                    {/* Speed Controls */}
                    <div className="flex items-center gap-1 bg-[#18181a] p-1 rounded-lg border border-gray-800 text-xs">
                        <span className="text-[10px] uppercase font-mono text-gray-500 px-1">Scroll:</span>
                        <button
                            onClick={() => setScrollSpeed(0)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${scrollSpeed === 0 ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Stop
                        </button>
                        <button
                            onClick={() => setScrollSpeed(1)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${scrollSpeed === 1 ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            1x
                        </button>
                        <button
                            onClick={() => setScrollSpeed(1.5)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${scrollSpeed === 1.5 ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            1.5x
                        </button>
                        <button
                            onClick={() => setScrollSpeed(2)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${scrollSpeed === 2 ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            2x
                        </button>
                    </div>

                    {/* Font Size Adjuster */}
                    <div className="flex items-center gap-1 bg-[#18181a] p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
                            className="px-2 py-0.5 text-xs text-gray-300 hover:text-white font-mono"
                            title="Decrease text size"
                        >
                            A-
                        </button>
                        <span className="text-[10px] text-gray-500 font-mono">{fontSize}px</span>
                        <button
                            onClick={() => setFontSize(prev => Math.min(36, prev + 2))}
                            className="px-2 py-0.5 text-xs text-gray-300 hover:text-white font-mono"
                            title="Increase text size"
                        >
                            A+
                        </button>
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-[#18181a] border border-gray-800 text-gray-400 hover:text-white"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    {/* Exit Preach Mode */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white"
                        title="Exit Preach Mode"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* TELEPROMPTER CANVAS */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 py-12 scroll-smooth"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
            >
                <div className="max-w-4xl mx-auto space-y-8 font-serif pb-64">
                    {/* Header in Manuscript */}
                    <div className="border-b border-gray-800 pb-6 mb-8 text-center">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">
                            {title || "Sermon Manuscript"}
                        </h1>
                        {scripture && (
                            <p className="text-xl md:text-2xl text-[#D4AF37] italic font-serif">
                                {scripture}
                            </p>
                        )}
                    </div>

                    {/* Manuscript Content Render */}
                    {contentHtml ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: contentHtml }}
                            className="prose prose-invert max-w-none prose-p:text-gray-200 prose-headings:text-white prose-blockquote:border-l-4 prose-blockquote:border-[#D4AF37] prose-blockquote:bg-[#121214] prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-[#D4AF37]"
                        />
                    ) : (
                        <div className="text-center py-20 text-gray-500 font-sans">
                            <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No manuscript text entered yet.</p>
                            <p className="text-sm mt-1">Write your sermon in the Studio workspace and return here to preach.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
