"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Share, Bookmark, User, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { useState } from "react";
import { toast } from "sonner";

interface MessageBubbleProps {
    role: "user" | "ai";
    content: React.ReactNode | string;
    onSave?: () => void;
    onCopy?: () => void;
    onShare?: () => void;
}

export function MessageBubble({ role, content, onSave, onCopy, onShare }: MessageBubbleProps) {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (typeof content === "string") {
            navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success("Scripture & reflection copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
        if (onCopy) onCopy();
    };

    const handleShare = () => {
        if (typeof content === "string" && navigator.share) {
            navigator.share({
                title: "RhemaAI Word",
                text: content,
            }).catch(() => {});
        } else {
            handleCopy();
        }
        if (onShare) onShare();
    };

    return (
        <div className={cn("flex w-full gap-4", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-[#D4AF37]">
                        <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn("flex flex-col gap-2 max-w-[85%] md:max-w-[78%]", isUser && "items-end")}>
                <div
                    className={cn(
                        "rounded-2xl px-5 py-4 leading-relaxed transition-all",
                        isUser
                            ? "bg-muted text-foreground text-sm md:text-base rounded-tr-sm"
                            : "bg-card/40 border border-border/40 text-foreground/95 rounded-tl-sm text-sm md:text-base prose prose-invert prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-[#D4AF37] prose-blockquote:border-l-[#D4AF37] prose-blockquote:text-gray-300 prose-blockquote:italic"
                    )}
                >
                    {typeof content === "string" && !isUser ? (
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                            {content}
                        </ReactMarkdown>
                    ) : (
                        content
                    )}
                </div>

                {!isUser && typeof content === "string" && content.length > 0 && (
                    <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={handleCopy}
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">Copy</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={handleShare}
                            title="Share revelation"
                        >
                            <Share className="h-4 w-4" />
                            <span className="sr-only">Share</span>
                        </Button>
                        {onSave && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={onSave}
                                title="Save to journal"
                            >
                                <Bookmark className="h-4 w-4" />
                                <span className="sr-only">Save</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
