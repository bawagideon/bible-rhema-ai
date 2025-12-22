"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Calendar } from "lucide-react";

interface DailyRhemaCardProps {
    date: string;
    scripture: string;
    reference: string;
    rhema: string;
    className?: string;
}

export function DailyRhemaCard({ date, scripture, reference, rhema, className }: DailyRhemaCardProps) {
    return (
        <Card className={cn("relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/50", className)}>
            {/* Decorative Gold Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/5 opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />

            <CardContent className="p-6 md:p-8 relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between text-muted-foreground text-sm uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary/80">
                        <Sparkles className="w-3 h-3" />
                        <span>Daily Rhema</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <blockquote className="font-serif text-2xl md:text-4xl leading-tight text-foreground border-l-4 border-primary/20 pl-6 italic">
                        "{scripture}"
                    </blockquote>
                    <p className="text-right text-lg md:text-xl font-serif text-primary mt-2">— {reference}</p>
                </div>

                <div className="bg-muted/30 rounded-lg p-5 border border-border/50 backdrop-blur-sm">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/90 mr-1">Insight:</strong>
                        {rhema}
                    </p>
                </div>

                <div className="pt-2">
                    <Button className="bg-primary hover:bg-primary/90 text-black font-semibold min-w-[140px]">
                        Meditate
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
