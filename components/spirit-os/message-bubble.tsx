"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Share, Bookmark, User } from "lucide-react";

interface MessageBubbleProps {
    role: "user" | "ai";
    content: React.ReactNode;
    onSave?: () => void;
    onCopy?: () => void;
    onShare?: () => void;
}

export function MessageBubble({ role, content, onSave, onCopy, onShare }: MessageBubbleProps) {
    const isUser = role === "user";

    return (
        <div className={cn("flex w-full gap-4", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn("flex flex-col gap-2 max-w-[85%] md:max-w-[75%]", isUser && "items-end")}>
                <div
                    className={cn(
                        "rounded-2xl px-5 py-3 text-sm md:text-base leading-relaxed transition-all",
                        isUser
                            ? "bg-muted text-foreground rounded-tr-sm"
                            : "bg-transparent text-foreground/90 font-serif text-lg md:text-xl pl-0"
                    )}
                >
                    {content}
                </div>

                {!isUser && (
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onSave}>
                            <Bookmark className="h-4 w-4" />
                            <span className="sr-only">Save</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onCopy}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onShare}>
                            <Share className="h-4 w-4" />
                            <span className="sr-only">Share</span>
                        </Button>
                    </div>
                )}
            </div>

            {isUser && (
                <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
