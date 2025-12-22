"use client";

import { useState, ReactNode, useRef } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: ReactNode | string;
}

export function useSpiritOS() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // We use a ref to track the current AI message content during streaming
    // to avoid stale closure issues inside the stream loop
    const streamContent = useRef("");

    const sendMessage = async (text: string) => {
        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error("Missing Supabase Environment Variables");
            }

            // 2. Call Edge Function
            const response = await fetch(`${supabaseUrl}/functions/v1/chat-with-rhema`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ query: text })
            });

            if (!response.ok) {
                throw new Error(`Oracles Silent: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            // 3. Prepare AI Message Placeholder
            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: ChatMessage = {
                id: aiMsgId,
                role: 'ai',
                content: "" // Start empty
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

                // Update the specific message in state
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId
                        ? { ...msg, content: streamContent.current }
                        : msg
                ));
            }

        } catch (error: any) {
            console.error("SpiritOS Error:", error);

            // Fallback Message
            const errorMsg: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'ai',
                content: "I am praying on this... (The connection to the SpiritOS Prophet seems interrupted. Please check your API Keys and Network.)"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        sendMessage,
        isLoading
    };
}
