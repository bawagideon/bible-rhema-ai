"use client";

import { useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, BookOpen, Heart, Trash2 } from "lucide-react";
import { MessageBubble } from "@/components/spirit-os/message-bubble";
import { useSpiritOS } from "@/hooks/use-spirit-os";
import { useRhema } from "@/lib/store/rhema-context";
import { Badge } from "@/components/ui/badge";

export default function SpiritOSPage() {
    const [mode, setMode] = useState<"devotion" | "exegesis">("devotion");
    const [inputValue, setInputValue] = useState("");
    const { messages, sendMessage, clearMessages, isLoading } = useSpiritOS();
    const { userRole } = useRhema();

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;
        sendMessage(inputValue, mode);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickPrompts = {
        devotion: [
            "A prayer for peace and freedom from anxiety",
            "Seeking clarity on an important life decision",
            "Thankfulness and renewed strength for today"
        ],
        exegesis: [
            "Examine Romans 8:28 in original Greek context",
            "What is the historical meaning of the Beatitudes?",
            "Explain the difference between Rhema and Logos"
        ]
    };

    return (
        <ShellLayout>
            <div className="flex flex-col h-full relative">
                {/* HEADER */}
                <header className="flex-none h-16 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <h1 className="font-serif text-xl font-medium tracking-wide hidden md:block">SpiritOS</h1>
                        <Badge variant="outline" className="text-xs text-[#D4AF37] border-[#D4AF37]/30">
                            {userRole}
                        </Badge>
                    </div>

                    <Tabs
                        value={mode}
                        className="w-[320px]"
                        onValueChange={(val) => setMode(val as "devotion" | "exegesis")}
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="devotion" className="flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5 text-rose-400" />
                                <span>Devotion</span>
                            </TabsTrigger>
                            <TabsTrigger value="exegesis" className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                <span>Exegesis</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        {messages.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearMessages}
                                className="text-muted-foreground hover:text-destructive text-xs"
                                title="Clear conversation"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </header>

                {/* CHAT AREA */}
                <ScrollArea className="flex-1 p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-6 pb-20">
                        <div className="text-center text-xs text-muted-foreground uppercase tracking-widest my-4">
                            {mode === 'devotion' ? "Devotional Heart Walk" : "Expository Scripture Study"} • {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>

                        {messages.length === 0 && (
                            <div className="text-center py-12 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="font-serif text-2xl text-foreground font-semibold">
                                        {mode === 'devotion' ? "Stillness Before the Word" : "Deep Exegetical Inquiry"}
                                    </h2>
                                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                        {mode === 'devotion'
                                            ? "Pour out your heart, request prayer points, or reflect on a biblical meditation for your spirit."
                                            : "Analyze passages with original Hebrew/Greek words, covenant contexts, and cross-references."}
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row gap-2 justify-center items-center max-w-xl mx-auto pt-4">
                                    {quickPrompts[mode].map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setInputValue(prompt);
                                                sendMessage(prompt, mode);
                                            }}
                                            className="text-xs text-left bg-muted/40 hover:bg-muted border border-border/40 hover:border-primary/40 rounded-xl p-3 w-full transition-all text-muted-foreground hover:text-foreground"
                                        >
                                            <Sparkles className="w-3 h-3 text-[#D4AF37] mb-1 inline mr-1" />
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                role={msg.role}
                                content={msg.content}
                            />
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-[#D4AF37] text-sm font-medium border border-[#D4AF37]/20">
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                    <span>{mode === 'devotion' ? "Praying & Reflecting..." : "Exegeting Scripture..."}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* INPUT AREA */}
                <div className="flex-none p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-border/40 sticky bottom-0 z-20">
                    <div className="max-w-3xl mx-auto relative flex items-center gap-3">
                        <Input
                            placeholder={mode === 'devotion' ? "Share your heart, prayer request, or reflection..." : "Ask a theological question or enter a Scripture..."}
                            className="flex-1 bg-muted/50 border-border/50 focus-visible:ring-[#D4AF37]/50 text-base py-6 rounded-full pl-6"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />

                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-[0_0_15px_-3px_rgba(212,175,55,0.4)] transition-all hover:scale-105 shrink-0"
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                        >
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                            RhemaAI Divine Intelligence • {mode === 'devotion' ? 'Devotional Mode' : 'Scripture Study Mode'}
                        </span>
                    </div>
                </div>
            </div>
        </ShellLayout>
    );
}
