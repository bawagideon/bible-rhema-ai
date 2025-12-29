"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Prayer {
    id: string;
    title: string;
    status: 'active' | 'answered' | 'archived';
    ai_strategy?: string;
    scripture_ref?: string;
    created_at: string;
}

interface PrayerCardProps {
    prayer: Prayer;
    onStatusChange: (id: string, newStatus: 'active' | 'answered') => void;
    onDelete: (id: string) => void;
}

export function PrayerCard({ prayer, onStatusChange, onDelete }: PrayerCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80",
                prayer.status === 'answered' ? "border-[#D4AF37]/50 bg-[#D4AF37]/5" : "border-border"
            )}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Status Toggle */}
                    <button
                        onClick={() => onStatusChange(prayer.id, prayer.status === 'active' ? 'answered' : 'active')}
                        className={cn(
                            "mt-1 flex-shrink-0 transition-colors",
                            prayer.status === 'answered' ? "text-[#D4AF37]" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        {prayer.status === 'answered' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div
                            className="cursor-pointer"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <h3 className={cn(
                                "font-medium leading-none tracking-tight text-foreground transition-all",
                                prayer.status === 'answered' && "line-through text-muted-foreground"
                            )}>
                                {prayer.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>

                    {/* Expand Toggle */}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Expanded Content (AI Strategy) */}
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-border/50 text-sm"
                    >
                        {prayer.ai_strategy ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                                    <Sparkles className="h-3 w-3" />
                                    Divine Strategy
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {prayer.ai_strategy}
                                </p>
                                {prayer.scripture_ref && (
                                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-primary text-xs font-serif italic">
                                        "{prayer.scripture_ref}"
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground/50 text-xs italic">
                                Seeking divine strategy...
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(prayer.id)}
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2 text-xs"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Archive
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
