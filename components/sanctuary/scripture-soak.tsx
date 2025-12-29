"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabaseClient";

// Static mapping for MVP (could be dynamic via AI later)
const SCRIPTURE_MAP: Record<string, { ref: string, text: string }> = {
    "Doubt": { ref: "Romans 10:17", text: "Faith comes by hearing, and hearing by the word of God." },
    "Fear / Anxiety": { ref: "2 Timothy 1:7", text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind." },
    "Lack of Direction": { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart, and lean not on your own understanding." },
    "Burnout": { ref: "Matthew 11:28", text: "Come to Me, all you who labor and are heavy laden, and I will give you rest." },
    "Inconsistency": { ref: "Galatians 6:9", text: "And let us not grow weary while doing good, for in due season we shall reap if we do not lose heart." }
};

const DEFAULT_SCRIPTURE = { ref: "Psalm 46:10", text: "Be still, and know that I am God." };

export function ScriptureSoak() {
    const { getToken, userId } = useAuth();
    const [scripture, setScripture] = useState(DEFAULT_SCRIPTURE);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchContext = async () => {
            if (!userId) return;
            try {
                const token = await getToken({ template: 'supabase' });
                if (!token) return;
                const supabase = createClerkSupabaseClient(token);

                // Fetch user's "Struggle"
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('struggles')
                    .eq('id', userId)
                    .single();

                if (profile?.struggles && profile.struggles.length > 0) {
                    // Pick the first struggle for now
                    const struggle = profile.struggles[0];
                    if (SCRIPTURE_MAP[struggle]) {
                        setScripture(SCRIPTURE_MAP[struggle]);
                    }
                }
            } catch (err) {
                console.error("Failed to load scripture context", err);
            }
        };

        fetchContext();
    }, [userId, getToken]);

    // Fade in text slowly
    useEffect(() => {
        const timeout = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, delay: 1 }}
                        className="text-center max-w-2xl px-4"
                    >
                        <h2 className="font-serif text-3xl md:text-5xl text-foreground font-medium leading-tight tracking-tight drop-shadow-2xl">
                            "{scripture.text}"
                        </h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.6, y: 0 }}
                            transition={{ duration: 1, delay: 3 }}
                            className="mt-6 text-sm md:text-base font-sans text-muted-foreground uppercase tracking-widest"
                        >
                            {scripture.ref}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
