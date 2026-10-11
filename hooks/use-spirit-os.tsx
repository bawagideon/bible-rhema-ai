"use client";

import { useState, ReactNode, useRef } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    mode?: 'devotion' | 'exegesis';
}

export function useSpiritOS() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Track streaming content to avoid stale closures
    const streamContent = useRef("");

    const sendMessage = async (text: string, mode: 'devotion' | 'exegesis' = 'devotion') => {
        if (!text.trim()) return;

        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            mode
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // 2. Call Server-Side Next.js API Route
            const history = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/spirit-os', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: text,
                    mode,
                    history
                })
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => null);
                throw new Error(errJson?.error || `Request failed with status ${response.status}`);
            }

            if (!response.body) {
                throw new Error("No response stream available");
            }

            // 3. Prepare AI Message Placeholder
            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: ChatMessage = {
                id: aiMsgId,
                role: 'ai',
                content: "",
                mode
            };
            setMessages(prev => [...prev, aiMsg]);

            // 4. Handle Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            streamContent.current = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                streamContent.current += chunk;

                // Update message in state
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId
                        ? { ...msg, content: streamContent.current }
                        : msg
                ));
            }

        } catch (error: any) {
            console.error("SpiritOS Error:", error);

            // Informative, graceful fallback message
            const errorMsg: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'ai',
                content: "I am meditating on this... Our server encountered an unexpected interruption. Please try asking again in a moment.",
                mode
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return {
        messages,
        sendMessage,
        clearMessages,
        isLoading
    };
}
