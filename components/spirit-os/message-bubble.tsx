"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Share, Bookmark, Check, BookOpen, Heart, Palette } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRhema } from "@/lib/store/rhema-context";
import { JournalModal } from "@/components/journal/journal-modal";

interface MessageBubbleProps {
    role: "user" | "ai";
    content: string;
    mode?: "devotion" | "exegesis";
    query?: string;
}

export function MessageBubble({ role, content, mode = "exegesis", query = "" }: MessageBubbleProps) {
    const isUser = role === "user";
    const router = useRouter();
    const { setSermonToLoad } = useRhema();
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isJournalOpen, setIsJournalOpen] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success("Scripture & commentary copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveToLibrary = async () => {
        try {
            const res = await fetch("/api/studies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: query || (content.slice(0, 40) + "..."),
                    mode,
                    query,
                    content
                })
            });

            const data = await res.json();
            if (data.success) {
                setSaved(true);
                toast.success("Saved to your personal spiritual library!");
            } else {
                toast.error(data.error || "Failed to save study");
            }
        } catch (e: any) {
            toast.error("Save failed: " + e.message);
        }
    };

    if (isUser) {
        return (
            <div className="flex w-full justify-end">
                <div className="max-w-[85%] md:max-w-[70%] bg-gradient-to-r from-[#1c1c24] to-[#16161c] border border-gray-700/60 rounded-2xl rounded-tr-sm px-5 py-3.5 text-white text-sm md:text-base leading-relaxed shadow-lg">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex w-full gap-3 md:gap-4 justify-start">
                <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 mt-1">
                    {mode === 'devotion' ? (
                        <Heart className="h-4 w-4 text-rose-400" />
                    ) : (
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    )}
                </div>

                <div className="flex flex-col gap-2 max-w-[92%] md:max-w-[82%]">
                    {/* Header Pill */}
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${mode === 'devotion' ? 'text-rose-300 bg-rose-500/10 border-rose-500/20' : 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30'}`}>
                            {mode === 'devotion' ? "Devotional Companion" : "Exegesis Engine"}
                        </span>
                        <span className="text-[10px] text-gray-500">Gemini 3.8 Flash</span>
                    </div>

                    {/* Content Box */}
                    <div className="rounded-2xl rounded-tl-sm px-5 md:px-6 py-5 leading-relaxed bg-[#111113] border border-gray-800/80 text-gray-100 shadow-xl">
                        <div className="prose prose-invert max-w-none text-sm md:text-base space-y-4">
                            <ReactMarkdown
                                remarkPlugins={[remarkBreaks]}
                                components={{
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-serif font-bold text-[#D4AF37] border-b border-gray-800 pb-2 mt-4" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-base font-serif font-semibold text-[#D4AF37] mt-3" {...props} />,
                                    h4: ({ node, ...props }) => <h4 className="text-sm font-semibold text-gray-200 mt-2" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="my-3 border-l-2 border-[#D4AF37] bg-[#D4AF37]/5 px-4 py-2.5 rounded-r-lg font-serif italic text-gray-200" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-semibold text-[#D4AF37]" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 text-gray-300" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 text-gray-300" {...props} />,
                                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                    p: ({ node, ...props }) => <p className="leading-relaxed text-gray-300 my-2" {...props} />
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-7 text-xs text-gray-400 hover:text-white hover:bg-gray-800/60"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-green-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveToLibrary}
                            disabled={saved}
                            className="h-7 text-xs text-gray-400 hover:text-[#D4AF37] hover:bg-gray-800/60"
                        >
                            <Bookmark className={`h-3.5 w-3.5 mr-1 ${saved ? 'text-[#D4AF37] fill-[#D4AF37]' : ''}`} />
                            {saved ? "Saved in Library" : "Save to Library"}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSermonToLoad({
                                    title: query || "Exegetical Sermon Outline",
                                    scripture: query || "John 15:5",
                                    tone: mode === 'devotion' ? "Pastoral" : "Expository",
                                    notes: `<h2>Theological Exegesis</h2><p>${content.replace(/\n\n/g, '</p><p>')}</p>`,
                                    context: []
                                });
                                router.push("/studio");
                                toast.success("Sent to Sermon Studio");
                            }}
                            className="h-7 text-xs text-gray-400 hover:text-[#D4AF37] hover:bg-gray-800/60"
                        >
                            <Palette className="h-3.5 w-3.5 mr-1" />
                            Send to Studio
                        </Button>
                    </div>
                </div>
            </div>

            <JournalModal
                isOpen={isJournalOpen}
                onClose={() => setIsJournalOpen(false)}
                initialTitle={query ? `Reflection: ${query}` : "Scripture Meditation"}
                initialContent={`Insights from SpiritOS:\n\n${content.slice(0, 250)}...`}
            />
        </>
    );
}
