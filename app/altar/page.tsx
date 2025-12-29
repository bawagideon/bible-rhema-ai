"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabaseClient";
import { PrayerCard } from "@/components/altar/prayer-card"; // Need to create this
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame, ScrollText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AltarPage() {
    const { userId, getToken } = useAuth();
    const [prayers, setPrayers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newPrayer, setNewPrayer] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch Prayers
    const fetchPrayers = async () => {
        if (!userId) return;
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabase = createClerkSupabaseClient(token);

            const { data, error } = await supabase
                .from('prayers')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (data) setPrayers(data);
        } catch (error) {
            console.error("Error fetching prayers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrayers();
    }, [userId, getToken]);

    // Handle Add Prayer
    const handleAddPrayer = async () => {
        if (!newPrayer.trim()) return;

        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabase = createClerkSupabaseClient(token);

            // Optimistic Update
            const tempId = Math.random().toString();
            const optimisticPrayer = {
                id: tempId,
                title: newPrayer,
                status: 'active',
                created_at: new Date().toISOString(),
                user_id: userId
            };
            setPrayers([optimisticPrayer, ...prayers]);
            setIsDialogOpen(false);
            setNewPrayer("");
            toast.success("Prayer placed on the altar.");

            const { data, error } = await supabase
                .from('prayers')
                .insert({
                    user_id: userId,
                    title: optimisticPrayer.title,
                    status: 'active'
                })
                .select()
                .single();

            if (data) {
                // Replace temp ID with real one
                setPrayers(prev => prev.map(p => p.id === tempId ? data : p));

                // Trigger AI Strategy Generation (Fire & Forget or await)
                // For MVP, we'll just log or maybe call an edge function here later
                // await generatePrayerStrategy(data.id);
            }
        } catch (error) {
            toast.error("Failed to add prayer.");
        }
    };

    // Handle Status Change
    const handleStatusChange = async (id: string, newStatus: 'active' | 'answered') => {
        // Optimistic
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        if (newStatus === 'answered') toast.success("Praise God! Mark as Answered.");

        const token = await getToken({ template: 'supabase' });
        if (!token) return;
        const supabase = createClerkSupabaseClient(token);

        await supabase.from('prayers').update({ status: newStatus }).eq('id', id);
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        setPrayers(prev => prev.filter(p => p.id !== id));

        const token = await getToken({ template: 'supabase' });
        if (!token) return;
        const supabase = createClerkSupabaseClient(token);

        await supabase.from('prayers').delete().eq('id', id);
    };

    const activePrayers = prayers.filter(p => p.status === 'active');
    const answeredPrayers = prayers.filter(p => p.status === 'answered');

    // Mock Upper Room Count
    const activeIntercessors = 342;

    return (
        <div className="h-full flex flex-col p-6 max-w-7xl mx-auto space-y-8">
            {/* Header with Upper Room Pulse */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">The Altar</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">
                            {activeIntercessors} Intercessors in the Upper Room
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                            <Plus className="w-4 h-4 mr-2" />
                            New Prayer
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Lay a Request on the Altar</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Input
                                placeholder="What are you believing for?"
                                value={newPrayer}
                                onChange={(e) => setNewPrayer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPrayer()}
                            />
                            <Button onClick={handleAddPrayer} className="w-full">
                                Place on Altar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats / Streak (Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card/50 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
                    </div>
                </div>
                <div className="p-4 rounded-lg border bg-card/50 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                        <ScrollText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{activePrayers.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Requests</div>
                    </div>
                </div>
                <div className="p-4 rounded-lg border bg-card/50 flex items-center gap-4">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{answeredPrayers.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Answered</div>
                    </div>
                </div>
            </div>

            {/* Board */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="active">Active Intercession</TabsTrigger>
                    <TabsTrigger value="answered">Testimonies</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading altar...</div>
                    ) : activePrayers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            The altar is empty. Add a request to begin.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activePrayers.map(prayer => (
                                <PrayerCard
                                    key={prayer.id}
                                    prayer={prayer}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="answered" className="space-y-4">
                    {answeredPrayers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            No answered prayers yet. Keep pressing in!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {answeredPrayers.map(prayer => (
                                <PrayerCard
                                    key={prayer.id}
                                    prayer={prayer}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
