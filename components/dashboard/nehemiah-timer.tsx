"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Hammer, Music, BrainCircuit } from "lucide-react";
import { useAudio } from "@/lib/store/audio-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type TimerMode = "build" | "spirit";

export function NehemiahTimer({ heroMode = false }: { heroMode?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>("build");
  const { playTrack, currentTrackId } = useAudio();

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (!isActive) {
      if (mode === "build" && currentTrackId !== "lofi") {
        playTrack("lofi");
      } else if (mode === "spirit" && currentTrackId !== "harp") {
        playTrack("harp");
      }
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "build" ? 25 * 60 : 10 * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === "build" ? 25 * 60 : 10 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 25 bricks total (5 rows of 5)
  const elapsedMinutes = Math.min(25, Math.floor((25 * 60 - timeLeft) / 60));

  const rows = [
    [20, 21, 22, 23, 24],
    [15, 16, 17, 18, 19],
    [10, 11, 12, 13, 14],
    [5, 6, 7, 8, 9],
    [0, 1, 2, 3, 4],
  ];

  return (
    <Card className="card border-[rgba(243,229,171,0.18)] bg-[#121214] relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {mode === "build" ? (
              <Hammer className="w-4 h-4 text-[#D4AF37]" />
            ) : (
              <Music className="w-4 h-4 text-[#F3E5AB]" />
            )}
            <h3 className="serif font-semibold text-sm tracking-wider text-[#F8F9FA] m-0 uppercase">
              {mode === "build" ? "Nehemiah Wall (25m Focus)" : "Selah Pause (10m)"}
            </h3>
          </div>
          <div className="flex gap-1 bg-[#17171A] p-1 rounded-lg border border-[rgba(243,229,171,0.08)]">
            <button
              onClick={() => switchMode("build")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                mode === "build"
                  ? "bg-[#212126] text-[#D4AF37]"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
              title="Build Mode (25m)"
            >
              <BrainCircuit className="w-4 h-4" />
            </button>
            <button
              onClick={() => switchMode("spirit")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                mode === "spirit"
                  ? "bg-[#212126] text-[#F3E5AB]"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
              title="Spirit Mode (10m)"
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nehemiah 25-Brick Wall Visual */}
        {mode === "build" && (
          <div className="flex flex-col items-center justify-center py-4 bg-[#0A0A0B] rounded-xl border border-[rgba(243,229,171,0.08)] mb-6">
            <div className="flex flex-col gap-1.5">
              {rows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex gap-1.5"
                  style={{ marginLeft: rowIdx % 2 === 1 ? "18px" : "0px" }}
                >
                  {row.map((brickIdx) => {
                    const isLaid = brickIdx < elapsedMinutes;
                    return (
                      <span
                        key={brickIdx}
                        className={cn("bk !w-7 !h-3.5", isActive && "bk")}
                        style={
                          {
                            "--i": brickIdx,
                            background: isLaid ? "#B8912B" : undefined,
                            boxShadow: isLaid ? "0 0 6px rgba(212,175,55,0.4)" : undefined,
                          } as React.CSSProperties
                        }
                        title={`Minute ${brickIdx + 1} / 25`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <span className="dim text-[11px] tracking-widest uppercase mt-3">
              {elapsedMinutes} / 25 Bricks Laid
            </span>
          </div>
        )}

        <div className="text-center space-y-5">
          <div className="relative inline-block">
            <span
              className={cn(
                "text-5xl font-mono font-light tracking-widest tabular-nums",
                isActive ? "text-[#F8F9FA]" : "text-zinc-500"
              )}
            >
              {formatTime(timeLeft)}
            </span>
            {isActive && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -right-3 top-2 w-2 h-2 rounded-full bg-[#D4AF37]"
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleTimer}
              className="btn btn-p min-w-[130px]"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-1.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5" /> Start
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="btn btn-q !min-h-[44px] px-3.5"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
