"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/store/auth-context";
import { User } from "lucide-react";

// RE-USE CONSTANTS from Onboarding
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
    const { user, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Identity State
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Spiritual DNA State
    const [goals, setGoals] = useState<string[]>([]);
    const [struggles, setStruggles] = useState<string[]>([]);
    const [ministers, setMinisters] = useState("");
    const [bible, setBible] = useState("KJV");

    // Billing State
    const [tier, setTier] = useState("SEEKER");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                if (!supabase) return;
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error("Error fetching profile:", error);
                    return;
                }

                if (data) {
                    setFullName(data.full_name || "");
                    setAvatarUrl(data.avatar_url || "");
                    setGoals(data.spiritual_goals || []);
                    setStruggles(data.struggles || []);
                    // Handle array vs string for ministers if DB changed? Onboarding stores string in local state but saves array?
                    // Onboarding code: favorite_ministers: ministers (string). So DB column is likely text array or text?
                    // Let's check migration. The passed `ministers` in onboarding was a string state... but typically we'd split it?
                    // Wait, in onboarding `handleComplete`: favorite_ministers: ministers.
                    // If the column is text[], Supabase might error if we pass a string.
                    // Let's assume it's currently saving as string if it worked before, or I should handle it safely.
                    // "favorite_ministers" in deep_profile.sql was "text[]".
                    // If Onboarding passed a string to a text[] column, it might have failed or been cast automatically?
                    // Actually, the previous onboarding code I replaced passed `ministers` (string) to `favorite_ministers`.
                    // I will safely handle array <-> string conversion here.
                    const ministerData = data.favorite_ministers;
                    if (Array.isArray(ministerData)) {
                        setMinisters(ministerData.join(", "));
                    } else if (typeof ministerData === 'string') {
                        setMinisters(ministerData);
                    }

                    setBible(data.preferred_bible_version || "KJV");
                    setTier(data.tier || "SEEKER");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        if (!loading && user) {
            fetchProfile();
        }
    }, [user, loading]);

    const handleSave = async () => {
        if (!user || !supabase) return;
        setIsSaving(true);

        try {
            // Parse ministers to array
            const ministerList = ministers.split(',').map(m => m.trim()).filter(Boolean);

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    // avatar_url: avatarUrl, // TODO: Implement upload
                    spiritual_goals: goals,
                    struggles: struggles,
                    favorite_ministers: ministerList,
                    preferred_bible_version: bible,
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Settings updated successfully");
            // Optionally reload page to refresh context
            window.location.reload();
        } catch (error: any) {
            toast.error("Failed to update settings: " + error.message);
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

    if (loading || isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading Sanctuary...</div>;
    }

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight">Sanctuary Settings</h1>
                    <p className="text-muted-foreground">Manage your identity and spiritual profile.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <Tabs defaultValue="identity" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="identity">Identity</TabsTrigger>
                    <TabsTrigger value="dna">Spiritual DNA</TabsTrigger>
                    <TabsTrigger value="billing">Kingdom Investment</TabsTrigger>
                </TabsList>

                {/* IDENTITY TAB */}
                <TabsContent value="identity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile</CardTitle>
                            <CardDescription>How you appear in the community.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user?.email || ""} disabled className="bg-muted text-muted-foreground" />
                            </div>
                            {/* Avatar placeholder - could use Generate Image tool later to make presets */}
                            <div className="space-y-2">
                                <Label>Avatar</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold border border-primary/50">
                                        {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" /> : (fullName?.[0] || user?.email?.[0] || "?")}
                                    </div>
                                    <Button variant="outline" disabled>Change Avatar (Coming Soon)</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SPIRITUAL DNA TAB */}
                <TabsContent value="dna">
                    <Card>
                        <CardHeader>
                            <CardTitle>Spiritual Calibration</CardTitle>
                            <CardDescription>Update this often to help the AI minister to you effectively.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* GOALS */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Current Focus</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {SPIRITUAL_GOALS.map(goal => (
                                        <div key={goal}
                                            className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-all ${goals.includes(goal) ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50'}`}
                                            onClick={() => toggleGoal(goal)}
                                        >
                                            <Checkbox checked={goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} />
                                            <span>{goal}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MINISTERS & BIBLE */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Favorite Ministers / Authors</Label>
                                    <Input
                                        placeholder="e.g. Kenneth Hagin, Charles Capps"
                                        value={ministers}
                                        onChange={(e) => setMinisters(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Comma separated</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Preferred Bible Version</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {BIBLES.map(v => (
                                            <div
                                                key={v}
                                                className={`p-2 text-center text-sm rounded border cursor-pointer ${bible === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
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
                                <Label className="text-base font-semibold text-red-400">Areas of Intercession</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {STRUGGLES.map(s => (
                                        <div key={s}
                                            className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-all ${struggles.includes(s) ? 'bg-red-500/10 border-red-500/50' : 'border-border hover:border-red-500/30'}`}
                                            onClick={() => toggleStruggle(s)}
                                        >
                                            <Checkbox checked={struggles.includes(s)} onCheckedChange={() => toggleStruggle(s)} className="data-[state=checked]:bg-red-500" />
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BILLING TAB */}
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kingdom Investment</CardTitle>
                            <CardDescription>Manage your subscription and partner level.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                <div>
                                    <p className="font-semibold">Current Plan</p>
                                    <p className="text-2xl font-bold text-primary">{tier}</p>
                                </div>
                                <Button variant="outline" onClick={() => window.location.href = '/pricing'}>Change Plan</Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <p>To manage your payment method or view invoices, please visit our billing portal.</p>
                            </div>
                            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => toast.info("Stripe Portal Integration Pending")}>
                                Manage Subscription
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
