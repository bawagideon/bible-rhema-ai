"use client";

import { useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mic, Sparkles } from "lucide-react";
import { MessageBubble } from "@/components/spirit-os/message-bubble";
import { useSpiritOS } from "@/hooks/use-spirit-os";

export default function SpiritOSPage() {
    const [mode, setMode] = useState("devotion");
    const [inputValue, setInputValue] = useState("");
    const { messages, sendMessage, isLoading } = useSpiritOS();

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <ShellLayout>
            <div className="flex flex-col h-full relative">
                {/* HEADER */}
                <header className="flex-none h-16 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
                    <h1 className="font-serif text-xl font-medium tracking-wide hidden md:block">SpiritOS</h1>

                    <Tabs defaultValue="devotion" className="w-[300px]" onValueChange={setMode}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="devotion">Devotion</TabsTrigger>
                            <TabsTrigger value="exegesis">Exegesis</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="w-[80px] hidden md:block" /> {/* Spacer for centering */}
                </header>

                {/* CHAT AREA */}
                <ScrollArea className="flex-1 p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-8 pb-20">
                        <div className="text-center text-xs text-muted-foreground uppercase tracking-widest my-8">
                            Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground italic mt-20 opacity-50">
                                Begin your session...
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
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* INPUT AREA */}
                <div className="flex-none p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-border/40 sticky bottom-0 z-20">
                    <div className="max-w-3xl mx-auto relative flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Mic className="h-5 w-5" />
                        </Button>

                        <Input
                            placeholder={mode === 'devotion' ? "Share your heart..." : "Ask a theological question..."}
                            className="flex-1 bg-muted/50 border-border/50 focus-visible:ring-primary/50 text-base py-6 rounded-full pl-6"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />

                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-[0_0_15px_-3px_rgba(212,175,55,0.4)] transition-all hover:scale-105"
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                        >
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">SpiritOS v1.0 • Minister Tier</span>
                    </div>
                </div>
            </div>
        </ShellLayout>
    );
}
