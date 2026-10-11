"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRhema } from "@/lib/store/rhema-context";
import { CornerDownLeft, Sparkles, User, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const { userTier, refreshProfile } = useRhema();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Profile state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Spiritual Calibration
    const [goals, setGoals] = useState<string[]>([]);
    const [struggles, setStruggles] = useState<string[]>([]);
    const [ministers, setMinisters] = useState("");
    const [bible, setBible] = useState("ESV");

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
                    setFullName(data.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Believer");
                    setEmail(data.email || user.emailAddresses?.[0]?.emailAddress || "");
                    setAvatarUrl(data.avatar_url || user.imageUrl || "");
                    setGoals(data.spiritual_goals || []);
                    setStruggles(data.struggles || []);
                    setBible(data.preferred_bible_version || "ESV");

                    if (Array.isArray(data.favorite_ministers)) {
                        setMinisters(data.favorite_ministers.join(", "));
                    } else if (typeof data.favorite_ministers === "string") {
                        setMinisters(data.favorite_ministers);
                    }
                } else {
                    setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || "Believer");
                    setEmail(user.emailAddresses?.[0]?.emailAddress || "");
                    setAvatarUrl(user.imageUrl || "");
                }
            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user, isLoaded, router]);

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
                toast.success("Sanctuary settings updated successfully!");
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

    const toggleGoal = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const toggleStruggle = (s: string) => {
        setStruggles(prev => prev.includes(s) ? prev.filter(struggle => struggle !== s) : [...prev, s]);
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                    <p className="text-gray-400 text-sm">Calibrating Sanctuary Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white py-10 px-4 md:px-8 font-sans relative">
            {/* Top Navigation */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border border-gray-700/50"
                    title="Go Back"
                >
                    <CornerDownLeft className="h-5 w-5" />
                </button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold"
                >
                    {isSaving ? "Saving Changes..." : "Save Changes"}
                </Button>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-white">Sanctuary Settings</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage your identity, spiritual calibration, and kingdom stewardship.</p>
                </div>

                <Tabs defaultValue="identity" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-[#161616] border border-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="identity" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300">Identity</TabsTrigger>
                        <TabsTrigger value="dna" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300">Spiritual DNA</TabsTrigger>
                        <TabsTrigger value="billing" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300">Kingdom Stewardship</TabsTrigger>
                    </TabsList>

                    {/* IDENTITY TAB */}
                    <TabsContent value="identity" className="mt-6">
                        <Card className="bg-[#121212] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-xl text-[#D4AF37]">Public Profile</CardTitle>
                                <CardDescription className="text-gray-400">How you appear in the community prayer wall and journal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Display Name</Label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-[#1a1a1a] border-gray-700 text-white focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Email Address (Managed by Clerk)</Label>
                                    <Input
                                        value={email}
                                        disabled
                                        className="bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Avatar</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-[#1c1c1c] flex items-center justify-center text-xl font-bold border border-[#D4AF37]/40 overflow-hidden">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-[#D4AF37]" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">Avatar automatically synced from your Clerk account.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SPIRITUAL DNA TAB */}
                    <TabsContent value="dna" className="mt-6">
                        <Card className="bg-[#121212] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-xl text-[#D4AF37]">Spiritual Calibration</CardTitle>
                                <CardDescription className="text-gray-400">Personalize your SpiritOS and Devotional experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* GOALS */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-gray-200">Current Spiritual Focus</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {SPIRITUAL_GOALS.map(goal => (
                                            <div
                                                key={goal}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${goals.includes(goal) ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white' : 'bg-[#181818] border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                                onClick={() => toggleGoal(goal)}
                                            >
                                                <Checkbox checked={goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} />
                                                <span className="text-sm">{goal}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* MINISTERS & BIBLE */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-200 text-sm">Favorite Bible Teachers / Theologians</Label>
                                        <Input
                                            placeholder="e.g. C.S. Lewis, Charles Spurgeon, Timothy Keller"
                                            value={ministers}
                                            onChange={(e) => setMinisters(e.target.value)}
                                            className="bg-[#1a1a1a] border-gray-700 text-white"
                                        />
                                        <p className="text-xs text-gray-500">Separate multiple ministers with commas</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-200 text-sm">Preferred Scripture Translation</Label>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {BIBLES.map(v => (
                                                <div
                                                    key={v}
                                                    className={`p-2.5 text-center text-sm font-medium rounded-lg border cursor-pointer transition-all ${bible === v ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37]' : 'bg-[#181818] border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                                    onClick={() => setBible(v)}
                                                >
                                                    {v}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* STRUGGLES */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-rose-400">Areas Seeking Grace & Strength</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {STRUGGLES.map(s => (
                                            <div
                                                key={s}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${struggles.includes(s) ? 'bg-rose-950/20 border-rose-500 text-rose-200' : 'bg-[#181818] border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                                onClick={() => toggleStruggle(s)}
                                            >
                                                <Checkbox checked={struggles.includes(s)} onCheckedChange={() => toggleStruggle(s)} />
                                                <span className="text-sm">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* BILLING TAB */}
                    <TabsContent value="billing" className="mt-6">
                        <Card className="bg-[#121212] border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-xl text-[#D4AF37]">Kingdom Stewardship</CardTitle>
                                <CardDescription className="text-gray-400">Manage your subscription tier and ministry tools.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-5 border border-gray-800 rounded-xl bg-[#161616]">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Current Membership Tier</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-2xl font-bold text-[#D4AF37] font-serif">{userTier}</p>
                                            <Badge variant="outline" className="border-[#D4AF37]/50 text-[#D4AF37] text-xs">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push("/pricing")}
                                        className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-sm"
                                    >
                                        Upgrade Plan
                                    </Button>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                                    <span>Secured with 256-bit SSL Paystack encryption. Cancel or change plans anytime.</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
