"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                {/* Gold Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />

                {/* Logo / Icon */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full border border-primary/30 bg-primary/5">
                        <Sparkles className="w-12 h-12 text-primary animate-spin-slow" />
                    </div>

                    <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">
                        Rhema<span className="text-primary">AI</span>
                    </h1>

                    <div className="flex gap-1 mt-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                            />
                        ))}
                    </div>

                    <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                        Discernment loading...
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
