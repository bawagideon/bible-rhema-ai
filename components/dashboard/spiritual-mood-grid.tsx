"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MOODS = [
    "Joyful", "Anxious", "Grateful", "Seeking",
    "Weary", "Hopeful", "Broken", "Peaceful"
];

interface SpiritualMoodGridProps {
    className?: string;
}

export function SpiritualMoodGrid({ className }: SpiritualMoodGridProps) {
    return (
        <Card className={cn("flex flex-col", className)}>
            <CardHeader>
                <CardTitle className="font-serif text-xl font-normal text-muted-foreground">
                    How is your spirit today?
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full">
                    {MOODS.map((mood) => (
                        <Button
                            key={mood}
                            variant="outline"
                            className={cn(
                                "h-auto py-4 text-sm font-medium transition-all duration-300",
                                "hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_15px_-3px_rgba(212,175,55,0.3)]",
                                "active:scale-95"
                            )}
                        >
                            {mood}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
