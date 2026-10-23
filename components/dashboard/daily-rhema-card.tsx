"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabaseClient";
import { useRhema } from "@/lib/store/rhema-context";
import { toast } from "sonner";
import { HomeLoadingSkeleton } from "@/components/system/home-loading-skeleton";

interface DailyRhema {
  scripture_text: string;
  scripture_ref: string;
  content: string;
  prayer_focus: string;
  date: string;
}

interface DailyRhemaCardProps {
  className?: string;
  initialData?: DailyRhema;
  heroMode?: boolean;
}

export function DailyRhemaCard({
  className,
  initialData,
  heroMode = false,
}: DailyRhemaCardProps) {
  const { userTier } = useRhema();
  const { getToken } = useAuth();

  const [data, setData] = useState<DailyRhema | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [generating, setGenerating] = useState(false);
  const [hasSaidAmen, setHasSaidAmen] = useState(false);

  const isMinister = userTier === "MINISTER";

  useEffect(() => {
    if (!initialData) {
      checkDailyRhema();
    }
  }, [initialData]);

  const checkDailyRhema = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-rhema");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
      }
    } catch (error) {
      console.error("Error fetching daily rhema:", error);
      setData({
        scripture_text:
          "Thy word is a lamp unto my feet, and a light unto my path.",
        scripture_ref: "Psalm 119:105 (KJV)",
        content:
          "True peace is not the absence of life's demands, but the presence of the Shepherd walking beside you today.",
        prayer_focus: "Lord Jesus, lead me beside still waters and restore my soul.",
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmen = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // ignore on unsupported browsers
      }
    }
    setHasSaidAmen(true);
    toast.success("Amen recorded · Daily check-in complete");
  };

  const generateRhema = async (existingToken?: string) => {
    try {
      setGenerating(true);
      let token = existingToken;
      if (!token) {
        token = (await getToken({ template: "supabase" })) || undefined;
      }

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const supabase = createClerkSupabaseClient(token);
      const { data: newData, error } = await supabase.functions.invoke(
        "generate-daily-rhema"
      );

      if (error) throw error;

      if (newData) {
        setData(newData);
        toast.success("Fresh Manna Received!");
      }
    } catch (error: any) {
      console.error("Generation failed:", error);
      toast.error("Failed to receive daily word. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <HomeLoadingSkeleton />;
  }

  if (!data) return null;

  const handleCopyVerse = () => {
    if (!data) return;
    navigator.clipboard.writeText(`"${data.scripture_text}" — ${data.scripture_ref}`);
    toast.success("Scripture copied to clipboard");
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const text = encodeURIComponent(
      `*Daily Rhema*\n"${data.scripture_text}"\n— ${data.scripture_ref}\n\nRead more on Bible Rhema AI: https://bible-rhema-ai.vercel.app`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const words = data.scripture_text.split(/\s+/);

  return (
    <Card
      className={cn(
        "card relative overflow-hidden border border-[rgba(243,229,171,0.25)] bg-[#121214] transition-all duration-500 rounded-2xl shadow-xl shadow-black/40",
        className
      )}
    >
      {/* Gold Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/40 to-transparent" />

      <CardContent className="p-6 md:p-8 relative z-10 flex flex-col gap-6">
        {/* Kicker Header */}
        <div className="flex items-center justify-between text-xs tracking-wider">
          <div className="tag">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Daily Rhema · {data.scripture_ref}</span>
          </div>
          <span className="dim text-xs hidden sm:inline">{data.date}</span>
        </div>

        {/* Verse with Kindle Verse Unfurl */}
        <div className="space-y-4">
          <blockquote className="serif text-2xl md:text-3xl text-[#F8F9FA] font-normal italic leading-relaxed tracking-wide m-0">
            {words.map((word, idx) => (
              <span
                key={`${word}-${idx}`}
                className="w"
                style={{ "--i": idx } as React.CSSProperties}
              >
                {word}{" "}
              </span>
            ))}
          </blockquote>

          <div className="ul w-24 my-3" />

          <p className="muted text-xs md:text-sm leading-relaxed m-0">
            One verse, one question to sit with, one small step for today:{" "}
            <span className="text-[#F8F9FA] italic">{data.content}</span>
          </p>
        </div>

        {/* Action Bar with Amen Ripple check-in */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(243,229,171,0.08)]">
          <div className="flex items-center gap-3">
            <Link
              href={`/spirit-os?prompt=${encodeURIComponent(
                `Reflect on ${data.scripture_ref}: ${data.scripture_text}`
              )}`}
            >
              <button type="button" className="btn btn-p">
                Reflect on this →
              </button>
            </Link>

            <Link
              href={`/spirit-os?prompt=${encodeURIComponent(
                `Exegesis of ${data.scripture_ref}`
              )}`}
            >
              <button type="button" className="btn btn-s">
                Open in SpiritOS
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Kindle Amen Ripple Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAmen}
                className={cn(
                  "relative flex items-center justify-center transition-transform",
                  hasSaidAmen ? "opacity-80" : "hover:scale-105 active:scale-95"
                )}
                title="Say Amen (Daily check-in)"
              >
                <div className="amen !w-9 !h-9 text-xs font-bold font-serif">
                  <span className="rg" />
                  <span className="rg b" />
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                </div>
              </button>
              <span className="text-[11px] font-semibold tracking-wider text-[#F3E5AB]">
                {hasSaidAmen ? "AMEN ✓" : "AMEN"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleWhatsAppShare}
              className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
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
              className="h-8 w-8 text-zinc-400 hover:text-[#F8F9FA]"
              title="Copy verse"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </Button>

            {isMinister && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => generateRhema()}
                disabled={generating}
                className={cn(
                  "h-8 w-8 text-zinc-400 hover:text-[#D4AF37]",
                  generating && "animate-spin"
                )}
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
