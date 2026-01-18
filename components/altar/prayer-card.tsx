"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trash2, Maximize2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types matching PrayerWall
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
    onClick: () => void;
}

export function PrayerCard({ prayer, onStatusChange, onDelete, onClick }: PrayerCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                "group relative overflow-hidden rounded-xl border bg-card/60 backdrop-blur-xl transition-all shadow-sm hover:shadow-md cursor-pointer h-full flex flex-col justify-between",
                prayer.status === 'answered' ? "border-[#D4AF37]/50 bg-[#D4AF37]/5" : "border-border/60"
            )}
            onClick={onClick}
        >
            <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                    {/* Status Utility (Stop Propagation to avoid opening modal) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(prayer.id, prayer.status === 'active' ? 'answered' : 'active');
                        }}
                        className={cn(
                            "transition-colors",
                            prayer.status === 'answered' ? "text-[#D4AF37]" : "text-muted-foreground hover:text-primary"
                        )}
                        title={prayer.status === 'active' ? "Mark Answered" : "Mark Active"}
                    >
                        {prayer.status === 'answered' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(prayer.id);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5 hover:text-red-500" />
                    </Button>
                </div>

                <div className="space-y-3">
                    <h3 className={cn(
                        "font-medium text-lg leading-snug text-foreground transition-all line-clamp-3",
                        prayer.status === 'answered' && "line-through text-muted-foreground"
                    )}>
                        {prayer.title}
                    </h3>

                    {prayer.scripture_ref && (
                        <div className="inline-block px-2 py-1 bg-primary/5 rounded md:text-xs text-[10px] font-serif italic text-primary/80">
                            {prayer.scripture_ref}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}</span>
                <div className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    <Maximize2 className="w-3 h-3" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Focus</span>
                </div>
            </div>
        </motion.div>
    );
}
