"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

// OPTIONS
const SPIRITUAL_GOALS = [
    "Understanding Grace",
    "Prophetic Ministry",
    "Biblical History",
    "Spiritual Warfare",
    "Leadership",
    "Evangelism",
    "Healing"
];

const STRUGGLES = [
    "Inconsistency",
    "Fear / Anxiety",
    "Lack of Direction",
    "Doubt",
    "Burnout"
];

const BIBLES = ["KJV", "NKJV", "ESV", "NASB", "NLT", "MSG"];

export function SpiritualCalibrationForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [goals, setGoals] = useState<string[]>([]);
    const [struggles, setStruggles] = useState<string[]>([]);
    const [ministers, setMinisters] = useState("");
    const [bible, setBible] = useState("KJV");

    const toggleGoal = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const toggleStruggle = (s: string) => {
        setStruggles(prev => prev.includes(s) ? prev.filter(struggle => struggle !== s) : [...prev, s]);
    };

    const handleComplete = async () => {
        setIsLoading(true);
        // Save to Supabase

        if (!supabase) {
            toast.error("Supabase client not initialized.");
            setIsLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("You must be logged in.");
            setIsLoading(false);
            return;
        }

        const ministerList = ministers.split(',').map(m => m.trim()).filter(Boolean);

        const { error } = await supabase
            .from('profiles')
            .update({
                spiritual_goals: goals,
                struggles: struggles,
                favorite_ministers: ministerList,
                preferred_bible_version: bible
            })
            .eq('id', user.id);

        if (error) {
            toast.error("Failed to save profile. " + error.message);
            setIsLoading(false);
        } else {
            toast.success("Spiritual Profile Calibrated.");
            router.push('/studio'); // Redirect to Studio
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="mb-8 flex justify-center space-x-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#D4AF37]' : 'bg-gray-800'}`} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-serif font-bold text-white">Refining Your Focus</h2>
                            <p className="text-gray-400">What is your primary spiritual focus this season?</p>
                        </div>

                        <div className="space-y-3">
                            {SPIRITUAL_GOALS.map(goal => (
                                <div key={goal}
                                    className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-all ${goals.includes(goal) ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'border-gray-800 hover:border-gray-600'}`}
                                    onClick={() => toggleGoal(goal)}
                                >
                                    <Checkbox checked={goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-black" />
                                    <span className="text-white">{goal}</span>
                                </div>
                            ))}
                        </div>

                        <Button onClick={() => setStep(2)} disabled={goals.length === 0} className="w-full bg-white text-black hover:bg-gray-200">
                            Next
                        </Button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-serif font-bold text-white">Voices & Versions</h2>
                            <p className="text-gray-400">Who feeds your spirit?</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Favorite Ministers / Authors (Comma separated)</Label>
                                <Input
                                    className="bg-gray-900 border-gray-800 text-white"
                                    placeholder="e.g. Kenneth Hagin, Charles Capps, Smith Wigglesworth"
                                    value={ministers}
                                    onChange={(e) => setMinisters(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300">Preferred Bible Version</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {BIBLES.map(v => (
                                        <div
                                            key={v}
                                            className={`p-2 text-center text-sm rounded border cursor-pointer ${bible === v ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                            onClick={() => setBible(v)}
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button onClick={() => setStep(3)} className="w-full bg-white text-black hover:bg-gray-200">
                            Next
                        </Button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-serif font-bold text-white">Internal Blockers</h2>
                            <p className="text-gray-400">What are you overcoming right now?</p>
                        </div>

                        <div className="space-y-3">
                            {STRUGGLES.map(s => (
                                <div key={s}
                                    className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-all ${struggles.includes(s) ? 'bg-red-900/10 border-red-900/50' : 'border-gray-800 hover:border-gray-600'}`}
                                    onClick={() => toggleStruggle(s)}
                                >
                                    <Checkbox checked={struggles.includes(s)} onCheckedChange={() => toggleStruggle(s)} className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:text-white" />
                                    <span className="text-white">{s}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={handleComplete}
                            disabled={isLoading}
                            className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]"
                        >
                            {isLoading ? "Calibrating..." : "Finish Calibration"}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
