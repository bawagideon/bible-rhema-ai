"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ShellLayout } from "@/components/layout/shell-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame, ScrollText, CheckCircle2, Users, HeartHandshake, Shield, Sparkles, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface PrayerItem {
    id: string;
    user_id: string;
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

    return (
        <ShellLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto pb-24">
                {/* Header with New Prayer Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">The Altar</h1>
                            <Badge variant="outline" className="text-xs text-[#D4AF37] border-[#D4AF37]/30">
                                War Room
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cast your cares, stand in the gap for other believers, and keep record of God's faithfulness.
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold">
                                <Plus className="w-4 h-4 mr-2" />
                                Lay on the Altar
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#121212] border-gray-800 text-white max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-serif text-[#D4AF37]">Lay a Request on the Altar</DialogTitle>
                                <DialogDescription className="text-xs text-gray-400">
                                    "Do not be anxious about anything, but in everything by prayer and petition..."
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-300 font-medium">Prayer Focus / Title *</label>
                                    <Input
                                        placeholder="What are you standing in faith for?"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="bg-[#1a1a1a] border-gray-700 text-white focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-300 font-medium">Supporting Scripture (Optional)</label>
                                    <Input
                                        placeholder="e.g. Isaiah 53:5, Matthew 18:19"
                                        value={newScripture}
                                        onChange={(e) => setNewScripture(e.target.value)}
                                        className="bg-[#1a1a1a] border-gray-700 text-white focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-300 font-medium">Details & Petitions (Optional)</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Specific needs, dates, or promises you are claiming..."
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        className="w-full rounded-md p-3 text-sm bg-[#1a1a1a] border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                                    />
                                </div>

                                {/* Community Opt-in Toggle */}
                                <div className="p-3 rounded-lg border border-gray-800 bg-[#161616] flex items-start space-x-3">
                                    <Checkbox
                                        id="comm"
                                        checked={isCommunity}
                                        onCheckedChange={(checked) => setIsCommunity(Boolean(checked))}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-0.5">
                                        <label htmlFor="comm" className="text-xs font-semibold text-white cursor-pointer">
                                            Share on Community Prayer Wall
                                        </label>
                                        <p className="text-[11px] text-gray-400">
                                            If checked, believers across the platform can see and intercede for this prayer. If unchecked, it remains strictly private in your Secret Place.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreatePrayer}
                                        disabled={isSubmitting}
                                        className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold"
                                    >
                                        {isSubmitting ? "Placing..." : "Place on Altar"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Real Dynamic Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl border border-gray-800/80 bg-[#141414] flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-full text-orange-500 border border-orange-500/20">
                            <Flame className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-serif text-white">{streakDays}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl border border-gray-800/80 bg-[#141414] flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 border border-blue-500/20">
                            <ScrollText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-serif text-white">{activePrayers.length}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">My Active Petitions</div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl border border-gray-800/80 bg-[#141414] flex items-center gap-4">
                        <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] border border-[#D4AF37]/30">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-serif text-white">{answeredPrayers.length}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Answered Testimonies</div>
                        </div>
                    </div>
                </div>

                {/* Altar Tabs: Community vs Secret Place */}
                <Tabs defaultValue="community" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#161616] border border-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="community" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300 font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Community Prayer Wall
                        </TabsTrigger>
                        <TabsTrigger value="private" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-gray-300 font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            My Secret Place ({myPrayers.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* COMMUNITY FEED */}
                    <TabsContent value="community" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                            <span>Live prayer requests shared by believers worldwide</span>
                            <span className="text-[#D4AF37] font-semibold">One-Click Intercession</span>
                        </div>

                        {communityPrayers.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
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
                                            className="p-5 rounded-xl border border-gray-800/80 bg-[#141414] hover:border-gray-700 transition-all flex flex-col justify-between space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-[#D4AF37]">
                                                        {prayer.author_name || "Fellow Believer"}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500">
                                                        {new Date(prayer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                <h4 className="text-base font-medium text-white">{prayer.title}</h4>

                                                {prayer.description && (
                                                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                                                        {prayer.description}
                                                    </p>
                                                )}

                                                {prayer.scripture_ref && (
                                                    <div className="text-[11px] text-gray-400 font-serif italic border-l-2 border-[#D4AF37]/50 pl-2 mt-2">
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
                                                        ? "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 text-xs"
                                                        : "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black text-xs font-semibold"}
                                                >
                                                    {hasPrayed ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 mr-1" /> Prayed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <HeartHandshake className="w-3.5 h-3.5 mr-1" /> Stand in Gap
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* PRIVATE ALAR */}
                    <TabsContent value="private" className="mt-6 space-y-4">
                        {myPrayers.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <Shield className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">Your Secret Place</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    You have no private petitions placed on your altar yet. Lay your first request before the Lord above.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myPrayers.map((prayer) => (
                                    <div
                                        key={prayer.id}
                                        className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${prayer.status === 'answered' ? 'bg-[#121812] border-green-500/30' : 'bg-[#141414] border-gray-800/80'}`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className={prayer.status === 'answered' ? 'border-green-500/40 text-green-400 text-[10px]' : 'border-gray-700 text-gray-400 text-[10px]'}>
                                                    {prayer.status === 'answered' ? 'Answered' : 'Active Petition'}
                                                </Badge>
                                                {prayer.is_community && (
                                                    <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                                                        Public
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-base font-medium text-white">{prayer.title}</h4>

                                            {prayer.description && (
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {prayer.description}
                                                </p>
                                            )}

                                            {prayer.scripture_ref && (
                                                <div className="text-[11px] text-gray-400 font-serif italic border-l-2 border-[#D4AF37]/50 pl-2">
                                                    "{prayer.scripture_ref}"
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between">
                                            <button
                                                onClick={() => handleDeletePrayer(prayer.id)}
                                                className="text-gray-500 hover:text-rose-400 text-xs transition-colors"
                                                title="Remove request"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            {prayer.status !== 'answered' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkAnswered(prayer.id)}
                                                    className="border-green-500/40 text-green-400 hover:bg-green-500/20 text-xs"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Answered
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-green-400 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Answered Prayer
                                                </span>
                                            )}
                                        </div>
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
