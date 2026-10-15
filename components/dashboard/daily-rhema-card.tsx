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
    heroMode?: boolean;
}

export function DailyRhemaCard({ className, initialData, heroMode = false }: DailyRhemaCardProps) {
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
            const res = await fetch('/api/daily-rhema');
            const resData = await res.json();
            if (resData.success && resData.data) {
                setData(resData.data);
            }
        } catch (error) {
            console.error("Error fetching daily rhema:", error);
            // Default comforting word
            setData({
                scripture_text: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures.",
                scripture_ref: "Psalm 23:1-2 (ESV)",
                content: "True peace is not the absence of life's demands, but the presence of the Shepherd walking beside you today.",
                prayer_focus: "Lord Jesus, lead me beside still waters and restore my soul.",
                date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            });
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

    const handleCopyVerse = () => {
        if (!data) return;
        navigator.clipboard.writeText(`"${data.scripture_text}" — ${data.scripture_ref}`);
        toast.success("Scripture copied to clipboard");
    };

    const handleWhatsAppShare = () => {
        if (!data) return;
        const text = encodeURIComponent(`*Daily Rhema*\n"${data.scripture_text}"\n— ${data.scripture_ref}\n\nRead more on Bible Rhema AI: https://bible-rhema-ai.vercel.app`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    return (
        <Card className={cn(
            "relative overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-br from-[#121214] via-[#0d0d0f] to-[#141418] transition-all duration-500 rounded-2xl shadow-xl shadow-black/40",
            className
        )}>
            {/* Gold Accent Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/40 to-transparent" />

            <CardContent className="p-6 md:p-8 relative z-10 flex flex-col gap-6">
                {/* Kicker Header */}
                <div className="flex items-center justify-between text-xs tracking-wider">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-semibold uppercase text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        <span>Daily Rhema · {data.scripture_ref}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{data.date}</span>
                </div>

                {/* Italic Serif Verse */}
                <div className="space-y-4">
                    <blockquote className="font-serif text-2xl md:text-3xl text-foreground font-normal italic leading-relaxed tracking-wide">
                        “{data.scripture_text}”
                    </blockquote>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        One verse, one question to sit with, one small step for today: <span className="text-foreground/90 italic">{data.content}</span>
                    </p>
                </div>

                {/* Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/40">
                    <div className="flex items-center gap-3">
                        <Link href={`/spirit-os?prompt=${encodeURIComponent(`Reflect on ${data.scripture_ref}: ${data.scripture_text}`)}`}>
                            <Button className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs h-9 px-4 shadow-sm shadow-[#D4AF37]/20">
                                Reflect on this →
                            </Button>
                        </Link>
                        <Link href={`/spirit-os?prompt=${encodeURIComponent(`Exegesis of ${data.scripture_ref}`)}`}>
                            <Button variant="outline" className="border-border text-foreground hover:bg-muted text-xs h-9 px-3">
                                Open in SpiritOS
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleWhatsAppShare}
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                            title="Share on WhatsApp"
                        >
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                            </svg>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyVerse}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Copy verse"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </Button>

                        {isMinister && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generateRhema()}
                                disabled={generating}
                                className={cn("h-8 w-8 text-muted-foreground hover:text-[#D4AF37]", generating && "animate-spin")}
                                title="Request fresh Rhema (Minister only)"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
