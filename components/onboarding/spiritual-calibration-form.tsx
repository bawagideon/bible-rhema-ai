"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabaseClient";
import { Sparkles, ArrowRight, BookOpen, Bell, Check, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// OPTIONS
const SPIRITUAL_GOALS = [
    "Understanding Grace",
    "Expository Preaching",
    "Personal Prayer Life",
    "Deep Greek / Hebrew Word Study",
    "Prophetic Ministry",
    "Spiritual Warfare",
    "Overcoming Anxiety",
    "Kingdom Leadership"
];

const STRUGGLES = [
    "Inconsistency in Devotion",
    "Fear / Anxiety",
    "Lack of Direction",
    "Spiritual Drought / Doubt",
    "Ministry Burnout"
];

// Screen 16 Translations
const FREE_BIBLES = [
    { code: "KJV", name: "King James Version", tag: "Included" },
    { code: "WEB", name: "World English Bible", tag: "Included" },
    { code: "ASV", name: "American Standard", tag: "Included" }
];

const LICENSED_BIBLES = [
    { code: "ESV", name: "English Standard", tag: "Licence needed" },
    { code: "NIV", name: "New International", tag: "Licence needed" },
    { code: "NLT", name: "New Living Trans.", tag: "Licence needed" }
];

// Screen 17 Starters
const FIRST_STUDY_STARTERS = [
    "Explain John 15:1-8 and why Jesus talks about pruning",
    "How do I overcome persistent anxiety according to Philippians 4:6-7?",
    "What is the biblical Greek distinction between agape and phileo?",
    "Help me structure an expository outline on Romans 8:28-39"
];

export function SpiritualCalibrationForm() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [goals, setGoals] = useState<string[]>([]);
    const [struggles, setStruggles] = useState<string[]>([]);
    const [ministers, setMinisters] = useState("");
    const [bible, setBible] = useState("KJV");
    const [firstStudyPrompt, setFirstStudyPrompt] = useState("");
    const [enableMorningReminder, setEnableMorningReminder] = useState(true);

    const toggleGoal = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const toggleStruggle = (s: string) => {
        setStruggles(prev => prev.includes(s) ? prev.filter(struggle => struggle !== s) : [...prev, s]);
    };

    const handleComplete = async () => {
        setIsLoading(true);

        try {
            if (!user) throw new Error("You must be logged in.");

            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error("Failed to retrieve auth token.");

            const supabase = createClerkSupabaseClient(token);

            // Timeout promise to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 15000)
            );

            // Perform Upsert
            const updatePromise = supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    spiritual_goals: goals,
                    struggles: struggles,
                    favorite_ministers: ministers.split(',').map(s => s.trim()).filter(Boolean),
                    preferred_bible_version: bible,
                    has_completed_onboarding: true
                }, { onConflict: 'id' });

            const { error }: any = await Promise.race([updatePromise, timeoutPromise]);

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            toast.success("Spiritual Calibration Complete!");

            // If user typed a first study prompt, route directly to SpiritOS with it!
            if (firstStudyPrompt.trim()) {
                window.location.href = `/spirit-os?prompt=${encodeURIComponent(firstStudyPrompt.trim())}`;
            } else {
                window.location.href = '/';
            }

        } catch (error: any) {
            console.error("Error saving profile:", error);
            toast.error(error.message || "Failed to save profile.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto font-sans">
            {/* Step Progress Indicators */}
            <div className="mb-8 flex justify-center space-x-2">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#D4AF37]' : 'bg-gray-800'}`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: SPIRITUAL FOCUS */}
                {step === 1 && (
                    <motion.div
                        key="1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <span className="text-[11px] font-mono uppercase text-[#D4AF37] tracking-wider">Step 1 of 4</span>
                            <h2 className="text-2xl font-serif font-bold text-white">Refining Your Spiritual Focus</h2>
                            <p className="text-xs text-gray-400">What is the Lord emphasizing in your life and ministry this season?</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {SPIRITUAL_GOALS.map(goal => (
                                <div
                                    key={goal}
                                    className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${goals.includes(goal) ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white' : 'bg-[#141416] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                    onClick={() => toggleGoal(goal)}
                                >
                                    <Checkbox checked={goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-black" />
                                    <span className="text-xs font-medium">{goal}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            disabled={goals.length === 0}
                            className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold text-xs py-5"
                        >
                            Next: Translations & Teachers
                        </Button>
                    </motion.div>
                )}

                {/* STEP 2: VOICES & TRANSLATION PICKER (SCREEN 16) */}
                {step === 2 && (
                    <motion.div
                        key="2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <span className="text-[11px] font-mono uppercase text-[#D4AF37] tracking-wider">Step 2 of 4</span>
                            <h2 className="text-2xl font-serif font-bold text-white">Scripture Translation</h2>
                            <p className="text-xs text-gray-400">Choose your default translation for exegesis and daily reading.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Free Public Domain */}
                            <div className="space-y-2">
                                <Label className="text-[11px] font-mono uppercase text-gray-400">Public Domain (Included Free)</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FREE_BIBLES.map(b => (
                                        <div
                                            key={b.code}
                                            onClick={() => setBible(b.code)}
                                            className={`p-3 rounded-xl text-center border cursor-pointer transition-all ${bible === b.code ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37]' : 'bg-[#141416] border-gray-800 text-gray-300 hover:border-gray-700'}`}
                                        >
                                            <div className="font-serif text-sm">{b.code}</div>
                                            <div className="text-[9px] opacity-75 mt-0.5">{b.tag}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Commercial */}
                            <div className="space-y-2">
                                <Label className="text-[11px] font-mono uppercase text-gray-400">Commercial Translations</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {LICENSED_BIBLES.map(b => (
                                        <div
                                            key={b.code}
                                            onClick={() => setBible(b.code)}
                                            className={`p-3 rounded-xl text-center border cursor-pointer transition-all ${bible === b.code ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37]' : 'bg-[#141416] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                        >
                                            <div className="font-serif text-sm">{b.code}</div>
                                            <div className="text-[9px] text-amber-400/80 mt-0.5">{b.tag}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Teachers */}
                            <div className="space-y-1.5 pt-2">
                                <Label className="text-xs text-gray-300">Favorite Bible Teachers / Theologians (Comma separated)</Label>
                                <Input
                                    className="bg-black/50 border-gray-800 text-white text-xs"
                                    placeholder="e.g. Charles Spurgeon, C.S. Lewis, Timothy Keller"
                                    value={ministers}
                                    onChange={(e) => setMinisters(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-gray-400">Back</Button>
                            <Button onClick={() => setStep(3)} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold text-xs py-5">
                                Next: Heart Check
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: HEART CHECK & STRUGGLES */}
                {step === 3 && (
                    <motion.div
                        key="3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <span className="text-[11px] font-mono uppercase text-[#D4AF37] tracking-wider">Step 3 of 4</span>
                            <h2 className="text-2xl font-serif font-bold text-white">Areas Seeking Grace</h2>
                            <p className="text-xs text-gray-400">Where are you asking the Holy Spirit for strength and breakthrough?</p>
                        </div>

                        <div className="space-y-2.5">
                            {STRUGGLES.map(s => (
                                <div
                                    key={s}
                                    className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${struggles.includes(s) ? 'bg-rose-950/20 border-rose-600 text-rose-200' : 'bg-[#141416] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                    onClick={() => toggleStruggle(s)}
                                >
                                    <Checkbox checked={struggles.includes(s)} onCheckedChange={() => toggleStruggle(s)} className="border-gray-500 data-[state=checked]:bg-rose-600 data-[state=checked]:text-white" />
                                    <span className="text-xs font-medium">{s}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setStep(2)} className="text-xs text-gray-400">Back</Button>
                            <Button onClick={() => setStep(4)} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold text-xs py-5">
                                Next: First Exegetical Study
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: FIRST STUDY SCREEN (SCREEN 17) */}
                {step === 4 && (
                    <motion.div
                        key="4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <span className="text-[11px] font-mono uppercase text-[#D4AF37] tracking-wider">Step 4 of 4</span>
                            <h2 className="text-2xl font-serif font-bold text-white">Your First Exegetical Study</h2>
                            <p className="text-xs text-gray-400">What passage or question is heavy on your heart today?</p>
                        </div>

                        <div className="space-y-3">
                            <Textarea
                                placeholder="Type a Scripture passage (e.g. John 15:1-8) or theological question..."
                                value={firstStudyPrompt}
                                onChange={(e) => setFirstStudyPrompt(e.target.value)}
                                rows={3}
                                className="bg-black/50 border-gray-800 text-white text-xs leading-relaxed focus-visible:ring-[#D4AF37]"
                            />

                            {/* Suggested Starters */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-mono uppercase text-gray-500">Or pick a starter:</Label>
                                <div className="space-y-1.5">
                                    {FIRST_STUDY_STARTERS.map((starter, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setFirstStudyPrompt(starter)}
                                            className="w-full text-left p-2.5 rounded-lg bg-[#141416] hover:bg-[#1c1c20] border border-gray-800 text-xs text-gray-300 hover:text-white transition-colors"
                                        >
                                            → "{starter}"
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Daily Morning Devotional Reminder Toggle */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141416] border border-gray-800 mt-2">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-[#D4AF37]" />
                                    <span className="text-xs text-gray-300">Send me a fresh Rhema scripture every morning at 06:30</span>
                                </div>
                                <Checkbox
                                    checked={enableMorningReminder}
                                    onCheckedChange={(checked) => setEnableMorningReminder(!!checked)}
                                    className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-black"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setStep(3)} className="text-xs text-gray-400">Back</Button>
                            <Button
                                onClick={handleComplete}
                                disabled={isLoading}
                                className="flex-1 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold text-xs py-5 flex items-center justify-center gap-2"
                            >
                                {isLoading ? "Calibrating Sanctuary..." : "Start First Study"}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
