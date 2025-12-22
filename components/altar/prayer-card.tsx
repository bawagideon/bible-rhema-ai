"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface PrayerItem {
    id: string;
    title: string;
    tag: string;
    count: number;
    isAnswered: boolean;
}

interface PrayerCardProps {
    prayer: PrayerItem;
    onToggleStatus: (id: string, isAnswered: boolean) => void;
}

export function PrayerCard({ prayer, onToggleStatus }: PrayerCardProps) {
    return (
        <Card
            className={cn(
                "p-4 border transition-all duration-300 group",
                prayer.isAnswered
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border hover:border-primary/30"
            )}
        >
            <div className="flex items-start gap-4">
                <Checkbox
                    id={`prayer-${prayer.id}`}
                    checked={prayer.isAnswered}
                    onCheckedChange={(checked) => onToggleStatus(prayer.id, checked as boolean)}
                    className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-muted-foreground/50"
                />

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor={`prayer-${prayer.id}`}
                            className={cn(
                                "font-medium leading-none cursor-pointer transition-all",
                                prayer.isAnswered ? "text-muted-foreground line-through decoration-primary/50" : "text-foreground"
                            )}
                        >
                            {prayer.title}
                        </label>
                        {prayer.isAnswered && (
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Answered</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="text-[10px] font-normal px-1.5 h-5">
                            {prayer.tag}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                            Prayed {prayer.count} times
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
