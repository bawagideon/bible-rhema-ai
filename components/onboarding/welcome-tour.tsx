"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    {
        title: "Daily Rhema",
        description: "Receive your daily word from the Lord. Every morning, new manna awaits.",
        image: "/manna-icon.png" // Placeholder
    },
    {
        title: "The Sanctuary",
        description: "A digital secret place. Use the Breathing Orb and Scripture Soak to find peace.",
        image: "/sanctuary-icon.png"
    },
    {
        title: "The Altar",
        description: "Your war room for prayer. Track petitions and build your spiritual history.",
        image: "/altar-icon.png"
    }
];

export function WelcomeTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Check local storage for first run
        const hasSeenTour = localStorage.getItem("rhema_welcome_tour");
        if (!hasSeenTour) {
            // Small delay for effect
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem("rhema_welcome_tour", "true");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleComplete()}>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-[#D4AF37]/30 p-0 overflow-hidden">
                <div className="h-2 bg-[#D4AF37]/20 w-full absolute top-0 left-0 z-10">
                    <motion.div
                        animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                        className="h-full bg-[#D4AF37]"
                    />
                </div>

                <div className="p-8 flex flex-col items-center text-center space-y-6 pt-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                            </div>

                            <h2 className="text-2xl font-serif font-bold tracking-tight">
                                {STEPS[step].title}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {STEPS[step].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <Button
                        size="lg"
                        onClick={handleNext}
                        className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold mt-4"
                    >
                        {step === STEPS.length - 1 ? (
                            <>
                                Begin Job <Check className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <>
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
