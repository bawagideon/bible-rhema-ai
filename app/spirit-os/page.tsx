"use client";

import { useState, useRef, useEffect } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, BookOpen, Heart, Trash2, Plus, Info, CornerDownLeft } from "lucide-react";
import { MessageBubble } from "@/components/spirit-os/message-bubble";
import { useRhema } from "@/lib/store/rhema-context";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams } from "next/navigation";

export interface ChatMessage {
    id: string;
    role: "user" | "ai";
    content: string;
    mode: "devotion" | "exegesis";
    query?: string;
}

export default function SpiritOSPage() {
    const [mode, setMode] = useState<"devotion" | "exegesis">("exegesis");
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Independent conversation threads by mode
    const [conversations, setConversations] = useState<{
        devotion: ChatMessage[];
        exegesis: ChatMessage[];
    }>({
        devotion: [],
        exegesis: []
    });

    const { userRole } = useRhema();
    const searchParams = useSearchParams();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Current messages
    const currentMessages = conversations[mode];

    // Check for initial prompt query param
    useEffect(() => {
        const initialPrompt = searchParams?.get("prompt");
        if (initialPrompt && currentMessages.length === 0) {
            handleSendMessage(initialPrompt, mode);
        }
    }, [searchParams]);

    // Auto-scroll on new messages or chunk streaming
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages, isLoading]);

    const handleSendMessage = async (text: string, activeMode: "devotion" | "exegesis") => {
        if (!text.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: text.trim(),
            mode: activeMode,
            query: text.trim()
        };

        // Append user message to active mode thread
        setConversations(prev => ({
            ...prev,
            [activeMode]: [...prev[activeMode], userMsg]
        }));

        setInputValue("");
        setIsLoading(true);

        try {
            const history = conversations[activeMode].slice(-6).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/spirit-os', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: text.trim(),
                    mode: activeMode,
                    history
                })
            });

            if (!response.ok || !response.body) {
                throw new Error("Unable to reach theological engine");
            }

            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: ChatMessage = {
                id: aiMsgId,
                role: "ai",
                content: "",
                mode: activeMode,
                query: text.trim()
            };

            setConversations(prev => ({
                ...prev,
                [activeMode]: [...prev[activeMode], aiMsg]
            }));

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;

                setConversations(prev => ({
                    ...prev,
                    [activeMode]: prev[activeMode].map(m =>
                        m.id === aiMsgId ? { ...m, content: accumulated } : m
                    )
                }));
            }
        } catch (error: any) {
            console.error("SpiritOS error:", error);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: "ai",
                content: "I am meditating on this... Our theological connection experienced a momentary interruption. Please resubmit your question.",
                mode: activeMode
            };
            setConversations(prev => ({
                ...prev,
                [activeMode]: [...prev[activeMode], errorMsg]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setConversations(prev => ({
            ...prev,
            [mode]: []
        }));
    };

    const quickPrompts = {
        exegesis: [
            "Examine John 1:1 in original Greek and historical context",
            "What is the covenant meaning of Hesed in the Old Testament?",
            "Explain Romans 8:28 hermeneutics and cross-references"
        ],
        devotion: [
            "A gentle prayer for peace when overwhelmed by anxiety",
            "Seeking God's guidance on an important decision",
            "Renewing joy and thankfulness in the secret place"
        ]
    };

    return (
        <ShellLayout>
            <TooltipProvider>
                <div className="flex flex-col h-full relative font-sans">
                    {/* Header */}
                    <header className="flex-none h-16 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 md:px-8">
                        <div className="flex items-center gap-3">
                            <h1 className="font-serif text-lg font-medium text-white tracking-wide">SpiritOS</h1>
                            <Badge variant="outline" className="text-xs text-[#D4AF37] border-[#D4AF37]/30">
                                {userRole}
                            </Badge>
                        </div>

                        {/* Mode Selector with Rich Tooltips */}
                        <div className="flex items-center gap-2">
                            <Tabs
                                value={mode}
                                className="w-[280px] md:w-[320px]"
                                onValueChange={(val) => setMode(val as "devotion" | "exegesis")}
                            >
                                <TabsList className="grid w-full grid-cols-2 bg-[#161616] border border-gray-800 p-0.5 rounded-xl">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TabsTrigger
                                                value="exegesis"
                                                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300 font-medium flex items-center gap-1.5 text-xs py-1.5"
                                            >
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>Exegesis</span>
                                            </TabsTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-xs bg-[#1a1a1a] border-gray-700 text-xs text-gray-200 p-3 leading-relaxed">
                                            <strong className="text-[#D4AF37] block mb-1">Exegesis Study Mode</strong>
                                            The careful, analytical study of Scripture exploring literary setting, historical covenant context, original Hebrew & Greek terms, cross-references, and responsible interpretation.
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TabsTrigger
                                                value="devotion"
                                                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300 font-medium flex items-center gap-1.5 text-xs py-1.5"
                                            >
                                                <Heart className="w-3.5 h-3.5" />
                                                <span>Devotion</span>
                                            </TabsTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-xs bg-[#1a1a1a] border-gray-700 text-xs text-gray-200 p-3 leading-relaxed">
                                            <strong className="text-rose-400 block mb-1">Devotional Heart Walk</strong>
                                            A reflective, Scripture-centred pastoral walk connecting God's Word directly to personal prayer, spiritual stillness, meditation on Christ's character, and practical life application.
                                        </TooltipContent>
                                    </Tooltip>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Thread Controls */}
                        <div className="flex items-center gap-2">
                            {currentMessages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNewChat}
                                    className="text-gray-400 hover:text-white text-xs gap-1"
                                    title="Start a new study in this mode"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">New Study</span>
                                </Button>
                            )}
                        </div>
                    </header>

                    {/* Chat Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="text-center text-xs text-muted-foreground uppercase tracking-widest my-2">
                                {mode === 'exegesis' ? "Expository Scripture Study" : "Devotional Heart Walk"} • {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>

                            {currentMessages.length === 0 && (
                                <div className="text-center py-12 md:py-16 space-y-6">
                                    <div className="space-y-2">
                                        <div className="inline-flex p-3 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 mb-2">
                                            {mode === 'exegesis' ? <BookOpen className="w-6 h-6" /> : <Heart className="w-6 h-6 text-rose-400" />}
                                        </div>
                                        <h2 className="font-serif text-2xl text-white font-semibold">
                                            {mode === 'exegesis' ? "Deep Exegetical Inquiry" : "Stillness Before the Word"}
                                        </h2>
                                        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                                            {mode === 'exegesis'
                                                ? "Ask theological questions, compare translations, analyze Hebrew/Greek root words, and discover covenant cross-references."
                                                : "Pour out your heart, request pastoral prayer points, or meditate on God's character and peace."}
                                        </p>
                                    </div>

                                    {/* Suggested Prompts */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
                                        {quickPrompts[mode].map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSendMessage(prompt, mode)}
                                                className="text-xs bg-[#141416] hover:bg-[#1c1c20] border border-gray-800/80 hover:border-[#D4AF37]/40 rounded-xl p-3.5 transition-all text-gray-300 hover:text-white flex flex-col justify-between group"
                                            >
                                                <span className="leading-relaxed">{prompt}</span>
                                                <span className="text-[10px] text-[#D4AF37] mt-2 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                    Ask Rhema →
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {currentMessages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    mode={msg.mode}
                                    query={msg.query}
                                />
                            ))}

                            {isLoading && (
                                <div className="flex justify-start items-center gap-3 animate-pulse">
                                    <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
                                    </div>
                                    <span className="text-xs text-[#D4AF37] font-medium">
                                        {mode === 'exegesis' ? "Consulting biblical texts & original languages..." : "Seeking Christ's peace & pastoral prayer..."}
                                    </span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Bottom Chat Input */}
                    <div className="flex-none p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-border/40 sticky bottom-0 z-20">
                        <div className="max-w-3xl mx-auto relative flex items-center gap-3">
                            <Input
                                placeholder={mode === 'exegesis' ? "Ask an exegetical question or enter a Scripture (e.g. Romans 8:28)..." : "Share your heart, prayer request, or meditation..."}
                                className="flex-1 bg-[#141416] border-gray-800 focus-visible:ring-[#D4AF37]/50 text-sm md:text-base py-6 rounded-full pl-6 text-white placeholder:text-gray-500"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(inputValue, mode);
                                    }
                                }}
                                disabled={isLoading}
                            />

                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-full bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-105 shrink-0"
                                onClick={() => handleSendMessage(inputValue, mode)}
                                disabled={isLoading || !inputValue.trim()}
                            >
                                <Send className="h-5 w-5 ml-0.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        </ShellLayout>
    );
}
