"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ShellLayout } from "@/components/layout/shell-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame, ScrollText, CheckCircle2, Users, HeartHandshake, Shield, Sparkles, Check, Trash2, Flag, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PrayerItem {
    id: string;
    user_id: string;
    is_author?: boolean;
    title: string;
    description?: string;
    author_name?: string;
    is_community: boolean;
    status: 'active' | 'answered' | 'archived';
    ai_strategy?: string;
    scripture_ref?: string;
    prayed_count: number;
    intercessors?: string[];
    created_at: string;
    answered_at?: string;
    testimony?: string;
}

export default function AltarPage() {
    const { userId } = useAuth();
    const { user } = useUser();
    const [myPrayers, setMyPrayers] = useState<PrayerItem[]>([]);
    const [communityPrayers, setCommunityPrayers] = useState<PrayerItem[]>([]);
    const [streakDays, setStreakDays] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // New Prayer Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newScripture, setNewScripture] = useState("");
    const [isCommunity, setIsCommunity] = useState(false);
    const [communityConsent, setCommunityConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch user stats & prayers
    const fetchAllData = async () => {
        try {
            setIsLoading(true);

            // 1. Fetch User Stats
            const statsRes = await fetch('/api/user/stats');
            const statsData = await statsRes.json();
            if (statsData && typeof statsData.streak === "number") {
                setStreakDays(statsData.streak);
            }

            // 2. Fetch User's Private Prayers
            const myRes = await fetch('/api/prayers');
            const myData = await myRes.json();
            if (myData.success && Array.isArray(myData.data)) {
                setMyPrayers(myData.data);
            }

            // 3. Fetch Community Prayers
            const commRes = await fetch('/api/prayers?feed=community');
            const commData = await commRes.json();
            if (commData.success && Array.isArray(commData.data)) {
                setCommunityPrayers(commData.data);
            }
        } catch (error) {
            console.error("Error loading prayers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [userId]);

    const handleCreatePrayer = async () => {
        if (!newTitle.trim()) {
            toast.error("Please provide a prayer title or petition.");
            return;
        }

        if (isCommunity && !communityConsent) {
            toast.error("Please confirm your consent to publish to the community prayer wall.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/prayers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    description: newDescription.trim() || undefined,
                    scripture_ref: newScripture.trim() || undefined,
                    is_community: isCommunity,
                    community_consent: isCommunity ? communityConsent : false,
                    author_name: user?.firstName || 'Fellow Believer'
                })
            });

            const data = await res.json();
            if (data.success && data.data) {
                toast.success(isCommunity ? "Prayer placed on the Community War Room!" : "Prayer placed in your Secret Place.");
                setIsDialogOpen(false);
                setNewTitle("");
                setNewDescription("");
                setNewScripture("");
                setIsCommunity(false);
                setCommunityConsent(false);
                fetchAllData();
            } else {
                toast.error(data.error || "Failed to place prayer.");
            }
        } catch (e: any) {
            toast.error("Connection error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReportPrayer = async (prayerId: string) => {
        try {
            const res = await fetch('/api/prayers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: prayerId, action: 'report' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Petition reported and removed for moderation.");
                setCommunityPrayers(prev => prev.filter(p => p.id !== prayerId));
            } else {
                toast.error(data.error || "Failed to report petition.");
            }
        } catch (e: any) {
            toast.error("Network error: " + e.message);
        }
    };

    const handleUnpublishPrayer = async (prayerId: string) => {
        try {
            const res = await fetch('/api/prayers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: prayerId, is_community: false })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Petition moved to your private Secret Place.");
                setCommunityPrayers(prev => prev.filter(p => p.id !== prayerId));
                fetchAllData();
            } else {
                toast.error(data.error || "Failed to unpublish.");
            }
        } catch (e: any) {
            toast.error("Network error: " + e.message);
        }
    };

    const handleIntercede = async (prayerId: string) => {
        try {
            const res = await fetch('/api/prayers/intercede', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prayerId })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Amen! Joined in prayer.");
                // Update local community count
                setCommunityPrayers(prev => prev.map(p =>
                    p.id === prayerId
                        ? {
                            ...p,
                            prayed_count: data.prayedCount,
                            intercessors: userId && !p.intercessors?.includes(userId)
                                ? [...(p.intercessors || []), userId]
                                : p.intercessors
                        }
                        : p
                ));
            } else {
                toast.error(data.error || "Could not record intercession.");
            }
        } catch (e: any) {
            toast.error("Intercession error: " + e.message);
        }
    };

    const handleMarkAnswered = async (prayerId: string) => {
        try {
            const res = await fetch('/api/prayers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: prayerId, status: 'answered' })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Praise God! Prayer marked as answered.");
                fetchAllData();
            }
        } catch (e: any) {
            toast.error("Failed to update status");
        }
    };

    const handleDeletePrayer = async (prayerId: string) => {
        try {
            const res = await fetch(`/api/prayers?id=${prayerId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Prayer removed from the altar.");
                fetchAllData();
            }
        } catch (e: any) {
            toast.error("Delete failed");
        }
    };

    const activePrayers = myPrayers.filter(p => p.status === 'active');
    const answeredPrayers = myPrayers.filter(p => p.status === 'answered');

    const [communityFilter, setCommunityFilter] = useState<'all' | 'needs_prayer' | 'praise'>('all');
    const [quickTitle, setQuickTitle] = useState("");
    const [quickScripture, setQuickScripture] = useState("");
    const [quickIsCommunity, setQuickIsCommunity] = useState(false);
    const [quickCommunityConsent, setQuickCommunityConsent] = useState(false);
    const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

    const handleQuickAddPetition = async () => {
        if (!quickTitle.trim()) {
            toast.error("Please enter a petition");
            return;
        }

        if (quickIsCommunity && !quickCommunityConsent) {
            toast.error("Please confirm your explicit consent to publish to the community prayer wall.");
            return;
        }

        setIsQuickSubmitting(true);
        try {
            const res = await fetch('/api/prayers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: quickTitle.trim(),
                    scripture_ref: quickScripture.trim() || undefined,
                    is_community: quickIsCommunity,
                    community_consent: quickIsCommunity ? quickCommunityConsent : false,
                    author_name: user?.firstName || 'Fellow Believer'
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(quickIsCommunity ? "Placed on Community Prayer Wall!" : "Saved to your private altar!");
                setQuickTitle("");
                setQuickScripture("");
                setQuickIsCommunity(false);
                setQuickCommunityConsent(false);
                fetchAllData();
            } else {
                toast.error(data.error || "Failed to place prayer");
            }
        } catch (e: any) {
            toast.error("Network error: " + e.message);
        } finally {
            setIsQuickSubmitting(false);
        }
    };

    return (
        <ShellLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto pb-24 font-sans">
                {/* Header with New Prayer Action & 5m Timer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 uppercase mb-1">
                            PRAY · THE ALTAR
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">The Altar</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Cast your cares, stand in the gap for other believers, and keep record of God's faithfulness.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/sanctuary">
                            <Button variant="outline" size="sm" className="border-border text-foreground text-xs h-10 px-4">
                                Start prayer time · 5 min
                            </Button>
                        </Link>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold text-xs h-10 px-4 shadow-sm shadow-[#D4AF37]/20">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    New petition
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#121214] border-gray-800 text-white max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-serif text-[#D4AF37]">Place a Petition on the Altar</DialogTitle>
                                    <DialogDescription className="text-xs text-gray-400">
                                        "Do not be anxious about anything, but in everything by prayer and petition with thanksgiving..."
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-300 font-medium">Prayer Focus / Title *</label>
                                        <Input
                                            placeholder="What are you standing in faith for?"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            className="bg-[#1a1a1e] border-gray-700 text-white focus:border-[#D4AF37]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-300 font-medium">Supporting Scripture Anchor (Optional)</label>
                                        <Input
                                            placeholder="e.g. Philippians 4:6-7, Isaiah 53:5"
                                            value={newScripture}
                                            onChange={(e) => setNewScripture(e.target.value)}
                                            className="bg-[#1a1a1e] border-gray-700 text-white focus:border-[#D4AF37]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-300 font-medium">Details & Specific Petitions (Optional)</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Specific needs, dates, or promises you are claiming..."
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            className="w-full rounded-md p-3 text-sm bg-[#1a1a1e] border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                                        />
                                    </div>

                                    {/* Community Opt-in Toggle */}
                                    <div className="p-3.5 rounded-xl border border-gray-800 bg-[#16161a] space-y-3">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="comm"
                                                checked={isCommunity}
                                                onCheckedChange={(checked) => {
                                                    const val = Boolean(checked);
                                                    setIsCommunity(val);
                                                    if (!val) setCommunityConsent(false);
                                                }}
                                                className="mt-0.5"
                                            />
                                            <div className="space-y-0.5">
                                                <label htmlFor="comm" className="text-xs font-semibold text-white cursor-pointer">
                                                    Share with community prayer wall
                                                </label>
                                                <p className="text-[11px] text-gray-400">
                                                    If checked, believers across Bible Rhema AI can see and pray with you. If unchecked, it remains strictly private in your secret place.
                                                </p>
                                            </div>
                                        </div>

                                        {isCommunity && (
                                            <div className="pt-2 border-t border-gray-800/80 flex items-start space-x-3 pl-2">
                                                <Checkbox
                                                    id="comm-consent"
                                                    checked={communityConsent}
                                                    onCheckedChange={(checked) => setCommunityConsent(Boolean(checked))}
                                                    className="mt-0.5 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                                                />
                                                <label htmlFor="comm-consent" className="text-[11px] text-[#D4AF37] cursor-pointer leading-tight">
                                                    I understand this prayer will be visible to other believers on the public prayer wall, and I explicitly consent to publish it.
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400 text-xs">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreatePrayer}
                                            disabled={isSubmitting}
                                            className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold text-xs"
                                        >
                                            {isSubmitting ? "Placing..." : "Place on Altar"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* 3 Tabs: My petitions, Community, Answered (Screen 4 & 5) */}
                <Tabs defaultValue="my_petitions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-[#16161a] border border-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="my_petitions" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-semibold">
                            My petitions · {activePrayers.length}
                        </TabsTrigger>
                        <TabsTrigger value="community" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-semibold">
                            Community
                        </TabsTrigger>
                        <TabsTrigger value="answered" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-semibold">
                            Answered · {answeredPrayers.length}
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: MY PETITIONS (Screen 4) */}
                    <TabsContent value="my_petitions" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Main Petitions Column */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Inline Quick Composer */}
                                <div className="p-5 rounded-2xl bg-[#141416] border border-gray-800 shadow-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                                            <Flame className="w-3.5 h-3.5" /> What are you bringing before God today?
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground">Lay your burden on the altar</span>
                                    </div>
                                    <Input
                                        placeholder="E.g., Complete peace in my home, healing, guidance for next season..."
                                        value={quickTitle}
                                        onChange={(e) => setQuickTitle(e.target.value)}
                                        className="bg-black/50 border-gray-800 text-sm focus-visible:ring-[#D4AF37]"
                                    />
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                        <Input
                                            placeholder="Supporting Scripture (e.g. Philippians 4:6)"
                                            value={quickScripture}
                                            onChange={(e) => setQuickScripture(e.target.value)}
                                            className="bg-black/50 border-gray-800 text-xs sm:w-64"
                                        />
                                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="quick-comm"
                                                    checked={quickIsCommunity}
                                                    onCheckedChange={(c) => {
                                                        const isChecked = Boolean(c);
                                                        setQuickIsCommunity(isChecked);
                                                        if (!isChecked) setQuickCommunityConsent(false);
                                                    }}
                                                />
                                                <label htmlFor="quick-comm" className="text-xs text-gray-400 cursor-pointer">
                                                    Share with community
                                                </label>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={handleQuickAddPetition}
                                                disabled={isQuickSubmitting || !quickTitle.trim() || (quickIsCommunity && !quickCommunityConsent)}
                                                className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs font-semibold px-4"
                                            >
                                                {isQuickSubmitting ? "Adding..." : "+ Add petition"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Explicit Affirmative Consent Requirement for Quick Composer */}
                                    {quickIsCommunity && (
                                        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5">
                                            <Checkbox
                                                id="quick-consent"
                                                checked={quickCommunityConsent}
                                                onCheckedChange={(c) => setQuickCommunityConsent(Boolean(c))}
                                                className="mt-0.5"
                                            />
                                            <label htmlFor="quick-consent" className="text-xs text-amber-200/90 leading-tight cursor-pointer">
                                                I understand and affirmatively consent that this petition will be visible to all believers on the public Community Prayer Wall.
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Active Petitions List */}
                                {activePrayers.length === 0 ? (
                                    <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121214] space-y-3">
                                        <Flame className="w-10 h-10 text-gray-500 mx-auto" />
                                        <h3 className="font-serif text-lg font-semibold text-white">Your Altar is Quiet</h3>
                                        <p className="text-xs text-gray-400 max-w-md mx-auto">
                                            No active petitions are currently placed. Write what you are believing God for above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activePrayers.map((prayer) => (
                                            <div
                                                key={prayer.id}
                                                className="p-5 rounded-2xl border border-gray-800/80 bg-[#141416] hover:border-gray-700 transition-all space-y-4 shadow-lg shadow-black/20"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline" className="border-amber-500/30 text-[#D4AF37] bg-[#D4AF37]/10 text-[10px] font-semibold uppercase">
                                                            Praying · {prayer.prayed_count || 1} {prayer.prayed_count === 1 ? 'prayer' : 'prayers'}
                                                        </Badge>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {new Date(prayer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-base font-semibold text-white">{prayer.title}</h4>

                                                    {prayer.description && (
                                                        <p className="text-xs text-gray-300 leading-relaxed">
                                                            {prayer.description}
                                                        </p>
                                                    )}

                                                    {prayer.scripture_ref && (
                                                        <div className="p-3 rounded-xl bg-black/40 border border-border/40 text-xs font-serif italic text-[#D4AF37] flex items-center justify-between">
                                                            <span>“{prayer.scripture_ref}”</span>
                                                            <span className="text-[10px] font-sans not-italic text-muted-foreground uppercase">Anchor Verse</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-3 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleIntercede(prayer.id)}
                                                            className="bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs h-8 px-3"
                                                        >
                                                            <Check className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                                                            I prayed today
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMarkAnswered(prayer.id)}
                                                            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8 px-3"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                            Mark answered
                                                        </Button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeletePrayer(prayer.id)}
                                                        className="text-gray-500 hover:text-rose-400 text-xs p-1.5 transition-colors"
                                                        title="Remove petition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Rail: Rhythm, Scripture Promises, Faithfulness */}
                            <div className="space-y-6">
                                {/* Prayer Rhythm Tracker (PDF Screen 4) */}
                                <div className="p-5 rounded-2xl bg-[#141416] border border-gray-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#D4AF37]">
                                            Your Prayer Rhythm
                                        </h4>
                                        <span className="text-xs font-bold text-white">{streakDays} days in a row</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                                            const today = new Date().getDay();
                                            const isDone = i <= today && streakDays > 0;
                                            return (
                                                <div key={i} className="flex flex-col items-center gap-1">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                                        isDone
                                                            ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                                                            : i === today
                                                                ? "border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                                                                : "border border-gray-800 bg-[#18181c] text-gray-500"
                                                    )}>
                                                        {isDone ? "✓" : d}
                                                    </div>
                                                    <span className="text-[9px] text-gray-500">{d}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Verses to Pray */}
                                <div className="p-5 rounded-2xl bg-[#141416] border border-gray-800 space-y-3">
                                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#D4AF37]">
                                        Verses to Pray
                                    </h4>
                                    <div className="space-y-2">
                                        {[
                                            { ref: "Philippians 4:6-7", text: "Do not be anxious about anything, but in everything by prayer and supplication..." },
                                            { ref: "Psalm 103:2-3", text: "Bless the Lord, O my soul, who forgives all your iniquity, who heals all your diseases." },
                                            { ref: "Jeremiah 17:14", text: "Heal me, O Lord, and I shall be healed; save me, and I shall be saved." },
                                            { ref: "James 5:16", text: "The effective, fervent prayer of a righteous man avails much." }
                                        ].map((v, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setQuickScripture(v.ref);
                                                    toast.info(`Set "${v.ref}" as supporting scripture`);
                                                }}
                                                className="p-3 rounded-xl bg-black/40 border border-gray-800/80 hover:border-[#D4AF37]/40 cursor-pointer transition-all group"
                                            >
                                                <span className="font-serif text-xs font-semibold text-[#D4AF37] block group-hover:underline">
                                                    {v.ref}
                                                </span>
                                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 italic">
                                                    "{v.text}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* God's Faithfulness Record */}
                                <div className="p-5 rounded-2xl bg-[#121812] border border-emerald-500/30 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>God's Faithfulness Record</span>
                                    </div>
                                    <p className="text-xs text-gray-300">
                                        You have <strong className="text-emerald-400 font-serif">{answeredPrayers.length} answered {answeredPrayers.length === 1 ? 'prayer' : 'prayers'}</strong> recorded.
                                    </p>
                                    <p className="text-[11px] text-muted-foreground pt-1">
                                        Every answered petition is preserved to anchor your faith in future seasons.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: COMMUNITY PRAYER WALL (Screen 5) */}
                    <TabsContent value="community" className="mt-6 space-y-6">
                        {/* Emergency / Crisis Safety Banner (PDF Spec) */}
                        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs">
                            <Shield className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="font-bold uppercase tracking-wider text-rose-400 block">
                                    If you are in danger or crisis
                                </span>
                                <p className="text-rose-200/90 leading-relaxed text-[11px]">
                                    If you are experiencing overwhelming distress, thoughts of self-harm, or an acute crisis, please reach out for immediate professional care. In Nigeria, dial <strong>112</strong> (National Emergency Toll-Free) or reach mental health lifelines: <strong>Lagos MiND Lifeline (070 0000 6463 / 020 1410 6463 / WhatsApp 090 9000 6463 &bull; lagosmind.org)</strong> or <strong>MANI (0809 111 6264)</strong>. You are deeply loved by God and not alone.
                                </p>
                            </div>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: 'all', label: 'All Requests' },
                                    { id: 'needs_prayer', label: 'Needs Prayer' },
                                    { id: 'praise', label: 'Praise Reports' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setCommunityFilter(tab.id as any)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                            communityFilter === tab.id
                                                ? "bg-[#D4AF37] text-black font-semibold shadow-sm"
                                                : "bg-[#16161a] border border-gray-800 text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {communityPrayers.length} believers standing together
                            </span>
                        </div>

                        {/* Community Feed */}
                        {communityPrayers.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121214] space-y-3">
                                <HeartHandshake className="w-10 h-10 text-[#D4AF37] mx-auto opacity-70" />
                                <h3 className="font-serif text-lg font-semibold text-white">The Community Altar is Open</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    No public requests have been placed yet. Be the first to share a petition or believe God together in unity!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {communityPrayers.map((prayer) => {
                                    const hasPrayed = userId ? prayer.intercessors?.includes(userId) : false;
                                    return (
                                        <div
                                            key={prayer.id}
                                            className="p-5 rounded-2xl border border-gray-800/80 bg-[#141416] hover:border-gray-700 transition-all flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-[#D4AF37]">
                                                        {prayer.author_name || "Fellow Believer"}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-gray-500">
                                                            {new Date(prayer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        {prayer.is_author ? (
                                                            <button
                                                                onClick={() => handleUnpublishPrayer(prayer.id)}
                                                                className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20"
                                                                title="Remove from public wall back to your Secret Place"
                                                            >
                                                                <Lock className="w-3 h-3" />
                                                                Make Private
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleReportPrayer(prayer.id)}
                                                                className="text-gray-500 hover:text-rose-400 transition-colors p-1"
                                                                title="Report inappropriate content"
                                                            >
                                                                <Flag className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <h4 className="text-base font-semibold text-white">{prayer.title}</h4>

                                                {prayer.description && (
                                                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                                                        {prayer.description}
                                                    </p>
                                                )}

                                                {prayer.scripture_ref && (
                                                    <div className="text-[11px] text-[#D4AF37] font-serif italic border-l-2 border-[#D4AF37]/50 pl-2 mt-2">
                                                        "{prayer.scripture_ref}"
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                    <span>{prayer.prayed_count || 0} Believers Prayed</span>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => handleIntercede(prayer.id)}
                                                    className={hasPrayed
                                                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs"
                                                        : "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black text-xs font-semibold"}
                                                >
                                                    {hasPrayed ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 mr-1" /> Prayed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <HeartHandshake className="w-3.5 h-3.5 mr-1" /> I prayed for this
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Community Guidelines */}
                        <div className="p-4 rounded-xl bg-black/40 border border-gray-800/60 text-center text-xs text-muted-foreground">
                            <strong>Community Guidelines:</strong> We pray in faith, love, and truth. All petitions are moderated to uphold biblical encouragement and mutual edification.
                        </div>
                    </TabsContent>

                    {/* TAB 3: ANSWERED TESTIMONIES */}
                    <TabsContent value="answered" className="mt-6 space-y-4">
                        {answeredPrayers.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121214] space-y-3">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                                <h3 className="font-serif text-lg font-semibold text-white">Your Faithfulness Record</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    When prayers are answered, mark them in your active petitions to build a lifelong monument of God's provision.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {answeredPrayers.map((prayer) => (
                                    <div
                                        key={prayer.id}
                                        className="p-5 rounded-2xl border border-emerald-500/30 bg-[#121812] space-y-3 shadow-lg shadow-black/20"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] uppercase">
                                                Answered Prayer
                                            </Badge>
                                            <span className="text-muted-foreground text-[11px]">
                                                {new Date(prayer.answered_at || prayer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <h4 className="text-base font-semibold text-white">{prayer.title}</h4>

                                        {prayer.description && (
                                            <p className="text-xs text-gray-300 leading-relaxed">
                                                {prayer.description}
                                            </p>
                                        )}

                                        {prayer.scripture_ref && (
                                            <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 text-xs font-serif italic text-[#D4AF37]">
                                                "{prayer.scripture_ref}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </ShellLayout>
    );
}
