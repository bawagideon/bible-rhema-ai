"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShellLayout } from "@/components/layout/shell-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRhema } from "@/lib/store/rhema-context";
import {
    Sparkles, User, ShieldCheck, Flame, BookOpen, HeartHandshake,
    Check, Bell, Clock, AlertCircle, Save, Undo2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

// Translations per UI Direction PDF:
// "Default to public domain KJV, WEB, ASV. Mark ESV, NIV, NLT as licence needed."
const PUBLIC_DOMAIN_BIBLES = [
    { code: "KJV", name: "King James Version", badge: "Public Domain" },
    { code: "WEB", name: "World English Bible", badge: "Public Domain" },
    { code: "ASV", name: "American Standard Version", badge: "Public Domain" }
];

const LICENSED_BIBLES = [
    { code: "ESV", name: "English Standard Version", badge: "Licence needed" },
    { code: "NIV", name: "New International Version", badge: "Licence needed" },
    { code: "NLT", name: "New Living Translation", badge: "Licence needed" }
];

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const { userTier, userRole, refreshProfile } = useRhema();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Initial values for dirty tracking
    const [initialState, setInitialState] = useState<any>({});

    // Profile state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Spiritual Calibration
    const [goals, setGoals] = useState<string[]>([]);
    const [struggles, setStruggles] = useState<string[]>([]);
    const [ministers, setMinisters] = useState("");
    const [bible, setBible] = useState("KJV");
    const [reminderTime, setReminderTime] = useState("06:30");
    const [reminderEnabled, setReminderEnabled] = useState(true);

    // Stats
    const [stats, setStats] = useState({
        streak: 12,
        studies: 42,
        journal: 18,
        answered: 5
    });

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.push("/sign-in");
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                const data = await res.json();

                if (data && data.authenticated) {
                    const loadedName = data.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Gideon";
                    const loadedEmail = data.email || user.emailAddresses?.[0]?.emailAddress || "";
                    const loadedAvatar = data.avatar_url || user.imageUrl || "";
                    const loadedGoals = data.spiritual_goals || ["Understanding Grace", "Expository Preaching"];
                    const loadedStruggles = data.struggles || ["Inconsistency in Devotion"];
                    const loadedBible = data.preferred_bible_version || "KJV";
                    const loadedMinisters = Array.isArray(data.favorite_ministers)
                        ? data.favorite_ministers.join(", ")
                        : (typeof data.favorite_ministers === "string" ? data.favorite_ministers : "Charles Spurgeon, C.S. Lewis");

                    setFullName(loadedName);
                    setEmail(loadedEmail);
                    setAvatarUrl(loadedAvatar);
                    setGoals(loadedGoals);
                    setStruggles(loadedStruggles);
                    setBible(loadedBible);
                    setMinisters(loadedMinisters);

                    setInitialState({
                        fullName: loadedName,
                        goals: loadedGoals,
                        struggles: loadedStruggles,
                        bible: loadedBible,
                        ministers: loadedMinisters
                    });
                }
            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user, isLoaded, router]);

    // Check dirty state
    useEffect(() => {
        if (!initialState.fullName) return;
        const isDirty =
            fullName !== initialState.fullName ||
            bible !== initialState.bible ||
            ministers !== initialState.ministers ||
            JSON.stringify(goals) !== JSON.stringify(initialState.goals) ||
            JSON.stringify(struggles) !== JSON.stringify(initialState.struggles);
        setHasUnsavedChanges(isDirty);
    }, [fullName, bible, ministers, goals, struggles, initialState]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const ministerList = ministers
                .split(",")
                .map(m => m.trim())
                .filter(Boolean);

            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    spiritual_goals: goals,
                    struggles: struggles,
                    favorite_ministers: ministerList,
                    preferred_bible_version: bible,
                })
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Preferences updated successfully!");
                setInitialState({
                    fullName,
                    goals,
                    struggles,
                    bible,
                    ministers
                });
                setHasUnsavedChanges(false);
                await refreshProfile();
            } else {
                toast.error(result.error || "Failed to update settings");
            }
        } catch (error: any) {
            toast.error("Failed to connect to profile service: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setFullName(initialState.fullName || "");
        setBible(initialState.bible || "KJV");
        setMinisters(initialState.ministers || "");
        setGoals(initialState.goals || []);
        setStruggles(initialState.struggles || []);
        setHasUnsavedChanges(false);
        toast.info("Changes discarded");
    };

    const toggleGoal = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const toggleStruggle = (s: string) => {
        setStruggles(prev => prev.includes(s) ? prev.filter(struggle => struggle !== s) : [...prev, s]);
    };

    if (!isLoaded || isLoading) {
        return (
            <ShellLayout>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                        <Sparkles className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                        <p className="text-gray-400 text-sm">Calibrating Sanctuary Profile...</p>
                    </div>
                </div>
            </ShellLayout>
        );
    }

    return (
        <ShellLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto pb-32 font-sans">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Profile & Preferences</h1>
                            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-0 text-xs font-mono">
                                {userRole || 'SEEKER'} PLAN
                            </Badge>
                        </div>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                            Manage your public identity, scripture translation defaults, and spiritual walk rhythms.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push('/pricing')}
                            variant="outline"
                            className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs"
                        >
                            Manage Subscription
                        </Button>
                    </div>
                </div>

                {/* SCREENS 18 & 19: STAT BAR & 7-DAY WALK RHYTHM */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* STREAK */}
                    <div className="p-4 rounded-xl bg-[#141416] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span className="font-mono uppercase text-[10px] tracking-wider">Walk Streak</span>
                            <Flame className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-[#F3E5AB]">{stats.streak} Days</div>
                        <div className="flex items-center gap-1 pt-1 text-[10px] text-[#D4AF37]">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <span key={i} className={`w-4 h-4 rounded-full flex items-center justify-center font-mono ${i <= 4 ? 'bg-[#D4AF37] text-black font-bold' : 'bg-gray-800 text-gray-500'}`}>
                                    {day}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* STUDIES */}
                    <div className="p-4 rounded-xl bg-[#141416] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span className="font-mono uppercase text-[10px] tracking-wider">Exegetical Studies</span>
                            <BookOpen className="w-4 h-4 text-[#F3E5AB]" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-[#F3E5AB]">{stats.studies}</div>
                        <p className="text-[11px] text-gray-400">Stored in Library vault</p>
                    </div>

                    {/* JOURNAL */}
                    <div className="p-4 rounded-xl bg-[#141416] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span className="font-mono uppercase text-[10px] tracking-wider">Journal Reflections</span>
                            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-[#F3E5AB]">{stats.journal} Notes</div>
                        <p className="text-[11px] text-gray-400">Daily walk insights</p>
                    </div>

                    {/* ANSWERED PRAYERS */}
                    <div className="p-4 rounded-xl bg-[#141416] border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span className="font-mono uppercase text-[10px] tracking-wider">Answered Testimonies</span>
                            <HeartHandshake className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-[#F3E5AB]">{stats.answered} Recorded</div>
                        <p className="text-[11px] text-[#D4AF37] font-mono">Faithfulness record</p>
                    </div>
                </div>

                {/* TABS */}
                <Tabs defaultValue="preferences" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-[#141416] border border-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="preferences" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Translations & Rhythm
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Public Identity
                        </TabsTrigger>
                        <TabsTrigger value="calibration" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Spiritual Focus
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: TRANSLATIONS & RHYTHMS (SCREEN 18) */}
                    <TabsContent value="preferences" className="mt-6 space-y-6">
                        {/* TRANSLATION PICKER */}
                        <Card className="bg-[#141416] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl text-[#D4AF37]">
                                    Default Scripture Translation
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                    Used across SpiritOS exegesis, Sanctuary reading, and Daily Rhema cards.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Public Domain (Free & Included) */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-mono uppercase tracking-wider text-gray-400">
                                        Public Domain Translations (Full Text Available)
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {PUBLIC_DOMAIN_BIBLES.map((item) => (
                                            <div
                                                key={item.code}
                                                onClick={() => setBible(item.code)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all ${bible === item.code ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/10' : 'bg-[#18181a] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-serif font-bold text-base text-white">{item.code}</span>
                                                    <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px] font-mono">
                                                        {item.badge}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-400">{item.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Licensed Translations */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-mono uppercase tracking-wider text-gray-400">
                                        Commercial Translations
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {LICENSED_BIBLES.map((item) => (
                                            <div
                                                key={item.code}
                                                onClick={() => setBible(item.code)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all ${bible === item.code ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white' : 'bg-[#18181a] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-serif font-bold text-base text-white">{item.code}</span>
                                                    <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[9px] font-mono">
                                                        {item.badge}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-400">{item.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* DAILY RHYTHM REMINDER */}
                        <Card className="bg-[#141416] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl text-[#D4AF37] flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-[#D4AF37]" />
                                    Daily Rhythm Reminder
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                    Receive your Daily Rhema and morning prayer prompt directly when you awake.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#18181a] border border-gray-800">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-white">Morning Stillness Reminder</h4>
                                        <p className="text-xs text-gray-400">Pushes a devotional notification to begin your day in prayer.</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="time"
                                            value={reminderTime}
                                            onChange={(e) => setReminderTime(e.target.value)}
                                            className="w-32 bg-black/50 border-gray-700 text-sm font-mono text-white text-center focus-visible:ring-[#D4AF37]"
                                        />
                                        <button
                                            onClick={() => setReminderEnabled(!reminderEnabled)}
                                            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${reminderEnabled ? 'bg-[#D4AF37]' : 'bg-gray-800'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-black transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: PUBLIC IDENTITY (SCREEN 19) */}
                    <TabsContent value="profile" className="mt-6">
                        <Card className="bg-[#141416] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl text-[#D4AF37]">Public Profile</CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                    How you appear in The Altar prayer community and published sermon notes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-300">Display Name</Label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-black/50 border-gray-800 text-white text-sm focus-visible:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-300">Email Address (Managed by Clerk Auth)</Label>
                                    <Input
                                        value={email}
                                        disabled
                                        className="bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-300">Favorite Bible Teachers / Theologians</Label>
                                    <Input
                                        placeholder="e.g. Charles Spurgeon, C.S. Lewis, Timothy Keller"
                                        value={ministers}
                                        onChange={(e) => setMinisters(e.target.value)}
                                        className="bg-black/50 border-gray-800 text-white text-sm focus-visible:ring-[#D4AF37]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: SPIRITUAL FOCUS */}
                    <TabsContent value="calibration" className="mt-6">
                        <Card className="bg-[#141416] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl text-[#D4AF37]">Spiritual Calibration</CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                    Select the growth areas where SpiritOS will provide focused cross-references and insights.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-mono uppercase tracking-wider text-gray-400">Current Growth Areas</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {SPIRITUAL_GOALS.map((goal) => (
                                            <div
                                                key={goal}
                                                onClick={() => toggleGoal(goal)}
                                                className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${goals.includes(goal) ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white' : 'bg-[#18181a] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                            >
                                                <Checkbox checked={goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-black" />
                                                <span className="text-sm">{goal}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-mono uppercase tracking-wider text-rose-400">Areas Seeking Grace & Strength</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {STRUGGLES.map((struggle) => (
                                            <div
                                                key={struggle}
                                                onClick={() => toggleStruggle(struggle)}
                                                className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${struggles.includes(struggle) ? 'bg-rose-950/20 border-rose-500 text-rose-200' : 'bg-[#18181a] border-gray-800 text-gray-400 hover:border-gray-700'}`}
                                            >
                                                <Checkbox checked={struggles.includes(struggle)} onCheckedChange={() => toggleStruggle(struggle)} className="border-gray-500 data-[state=checked]:bg-rose-600 data-[state=checked]:text-white" />
                                                <span className="text-sm">{struggle}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* STICKY UNSAVED CHANGES BAR (Screen 19) */}
                {hasUnsavedChanges && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#161618] border border-[#D4AF37]/50 rounded-2xl px-6 py-3.5 shadow-2xl shadow-black/80 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 text-xs text-gray-200">
                            <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
                            <span>You have unsaved changes to your sanctuary preferences</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDiscard}
                                className="text-xs text-gray-400 hover:text-white h-8"
                            >
                                <Undo2 className="w-3.5 h-3.5 mr-1" />
                                Discard
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs h-8 px-4"
                            >
                                <Save className="w-3.5 h-3.5 mr-1" />
                                {isSaving ? "Saving..." : "Save Preferences"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </ShellLayout>
    );
}
