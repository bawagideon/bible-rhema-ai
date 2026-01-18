"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Calendar, RefreshCw } from "lucide-react";
import { useAuth } from '@clerk/nextjs';
// Replaced legacy supabase import
import { createClerkSupabaseClient } from "@/lib/supabaseClient";
import { useRhema } from "@/lib/store/rhema-context";
import { toast } from "sonner";

interface DailyRhema {
    scripture_text: string;
    scripture_ref: string;
    content: string;
    prayer_focus: string;
    date: string;
}

interface DailyRhemaCardProps {
    className?: string;
    // Optional props for optimistic updates or initial data
    initialData?: DailyRhema;
}

export function DailyRhemaCard({ className, initialData }: DailyRhemaCardProps) {
    const { userTier } = useRhema();
    const { getToken } = useAuth();
    // const supabase = useClerkSupabaseClient(); // Removed

    const [data, setData] = useState<DailyRhema | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [generating, setGenerating] = useState(false);

    const isMinister = userTier === 'MINISTER';

    useEffect(() => {
        if (!initialData) {
            checkDailyRhema();
        }
    }, [initialData]);

    const checkDailyRhema = async () => {
        try {
            setLoading(true);
            const token = await getToken({ template: 'supabase' });
            if (!token) {
                // If not logged in, maybe show generic or return
                setLoading(false);
                return;
            }
            const supabase = createClerkSupabaseClient(token);

            const today = new Date().toISOString().split('T')[0];
            const { data: existing, error } = await supabase
                .from('daily_rhema')
                .select('*')
                .eq('date', today)
                .single();

            if (existing) {
                setData(existing);
            } else {
                await generateRhema(token); // Pass token to avoid re-fetching
            }
        } catch (error) {
            console.error("Error fetching daily rhema:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateRhema = async (existingToken?: string) => {
        try {
            setGenerating(true);
            let token = existingToken;
            if (!token) {
                token = await getToken({ template: 'supabase' }) || undefined;
            }

            if (!token) {
                toast.error("Authentication required");
                return;
            }

            const supabase = createClerkSupabaseClient(token);

            const { data: newData, error } = await supabase.functions.invoke('generate-daily-rhema');

            if (error) throw error;

            if (newData) {
                setData(newData);
                toast.success("Fresh Manna Received!");
            }
        } catch (error: any) {
            console.error("Generation failed:", error);

            // Try to extract detailed error message from Edge Function response
            if (error && typeof error === 'object' && 'context' in error) {
                try {
                    const response = await (error as any).context.json();
                    console.error("Edge Function Error Details:", response);
                    if (response.error) {
                        toast.error(`Error: ${response.error}`);
                        return;
                    }
                } catch (e) {
                    console.log("Could not parse error context JSON", e);
                }
            }

            toast.error("Failed to receive daily word. Check console for details.");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <Card className={cn("relative overflow-hidden border-border/60 min-h-[300px] flex items-center justify-center", className)}>
                <div className="flex flex-col items-center gap-2 animate-pulse text-muted-foreground">
                    <Sparkles className="w-6 h-6 animate-spin-slow" />
                    <p>Seeking the Lord...</p>
                </div>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <Card className={cn("relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/50 transition-all duration-500",
            heroMode ? "min-h-[400px] flex flex-col justify-center border-primary/20 shadow-xl shadow-primary/5" : "",
            className
        )}>
            {/* Decorative Gold Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/5 opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />

            <CardContent className="p-6 md:p-10 relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between text-muted-foreground text-sm uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{data.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary/80">
                        <Sparkles className="w-3 h-3" />
                        <span>{heroMode ? "Morning Manna" : "Daily Rhema"}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <blockquote className={cn(
                            "font-serif leading-tight text-foreground border-l-4 border-primary/20 pl-6 italic transition-all",
                            heroMode ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl"
                        )}>
                            "{data.scripture_text}"
                        </blockquote>
                        <p className="text-right text-lg font-serif text-primary mt-2 flex items-center justify-end gap-2">
                            <span className="w-8 h-[1px] bg-primary/50" />
                            {data.scripture_ref}
                        </p>
                    </div>

                    {heroMode && (
                        <p className="text-xl text-muted-foreground font-light max-w-2xl leading-relaxed">
                            {data.content}
                        </p>
                    )}
                </div>

                {!heroMode && (
                    <div className="bg-muted/30 rounded-lg p-5 border border-border/50 backdrop-blur-sm">
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            <strong className="text-foreground/90 mr-1">Insight:</strong>
                            {data.content}
                        </p>
                        <div className="mt-4 pt-4 border-t border-border/40">
                            <p className="text-sm text-primary/90 italic">
                                <span className="font-semibold not-italic text-muted-foreground mr-1">Prayer:</span>
                                {data.prayer_focus}
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                    {heroMode ? (
                        <Link href="/altar?mode=morning_prayer">
                            <Button size="lg" className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold min-w-[200px] h-14 text-lg shadow-lg shadow-[#D4AF37]/20">
                                Start Morning Prayer
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/sanctuary">
                            <Button className="bg-primary hover:bg-primary/90 text-black font-semibold min-w-[140px]">
                                Meditate
                            </Button>
                        </Link>
                    )}

                    {isMinister && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generateRhema()}
                            disabled={generating}
                            className={cn("text-muted-foreground hover:text-primary", generating && "animate-spin")}
                            title="Request New Manna (Minister Only)"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
