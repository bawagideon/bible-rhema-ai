"use client";

import { useEffect, useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { fetchSermons, SavedSermon } from "@/lib/api";
import { useRhema } from "@/lib/store/rhema-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Library, Search, FileText, ArrowUpRight, Sparkles, Plus, BookOpen, Trash2, HeartHandshake, Bookmark, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LibraryPage() {
    const router = useRouter();
    const { setSermonToLoad, userRole } = useRhema();

    const [sermons, setSermons] = useState<SavedSermon[]>([]);
    const [studies, setStudies] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [answeredPrayers, setAnsweredPrayers] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [editingItem, setEditingItem] = useState<{
        type: 'study' | 'journal';
        id: string;
        title: string;
        content: string;
        scripture_ref?: string;
    } | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // 1. Sermons
            const sermRes = await fetchSermons();
            if (sermRes.success && sermRes.data) {
                setSermons(sermRes.data);
            }

            // 2. Saved Studies
            const studRes = await fetch('/api/studies');
            const studData = await studRes.json();
            if (studData.success && Array.isArray(studData.data)) {
                setStudies(studData.data);
            }

            // 3. Journals
            const journRes = await fetch('/api/journal');
            const journData = await journRes.json();
            if (journData.success && Array.isArray(journData.data)) {
                setJournals(journData.data);
            }

            // 4. Answered Prayers
            const prayRes = await fetch('/api/prayers');
            const prayData = await prayRes.json();
            if (prayData.success && Array.isArray(prayData.data)) {
                setAnsweredPrayers(prayData.data.filter((p: any) => p.status === 'answered'));
            }
        } catch (e) {
            console.error("Error loading library data:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenInStudio = (sermon: SavedSermon) => {
        setSermonToLoad(sermon.content_json);
        router.push("/studio");
    };

    const handleDeleteStudy = async (id: string) => {
        try {
            await fetch(`/api/studies?id=${id}`, { method: 'DELETE' });
            setStudies(prev => prev.filter(s => s.id !== id));
            toast.success("Study removed from library");
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    const handleDeleteJournal = async (id: string) => {
        try {
            await fetch(`/api/journal?id=${id}`, { method: 'DELETE' });
            setJournals(prev => prev.filter(j => j.id !== id));
            toast.success("Journal entry deleted");
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        if (!editingItem.content.trim()) {
            toast.error("Content cannot be empty");
            return;
        }

        setIsSavingEdit(true);
        try {
            if (editingItem.type === 'study') {
                const res = await fetch('/api/studies', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingItem.id,
                        title: editingItem.title,
                        content: editingItem.content,
                        scripture_ref: editingItem.scripture_ref
                    })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || "Failed to update study");
                }
                setStudies(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...data.data } : s));
                toast.success("Study updated successfully");
            } else {
                const res = await fetch('/api/journal', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingItem.id,
                        title: editingItem.title,
                        content: editingItem.content,
                        scripture_ref: editingItem.scripture_ref
                    })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || "Failed to update journal");
                }
                setJournals(prev => prev.map(j => j.id === editingItem.id ? { ...j, ...data.data } : j));
                toast.success("Journal reflection updated successfully");
            }
            setEditingItem(null);
        } catch (e: any) {
            console.error("Save edit error:", e);
            toast.error(e.message || "Failed to save updates");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const q = searchQuery.toLowerCase();
    const filteredStudies = studies.filter(s => s.title?.toLowerCase().includes(q) || s.content?.toLowerCase().includes(q));
    const filteredSermons = sermons.filter(s => s.title?.toLowerCase().includes(q) || s.content_json?.scripture?.toLowerCase().includes(q));
    const filteredJournals = journals.filter(j => j.title?.toLowerCase().includes(q) || j.content?.toLowerCase().includes(q));

    return (
        <ShellLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto pb-24 font-sans">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Theological Library</h1>
                            <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-xs">
                                {userRole} Vault
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs md:text-sm mt-1">
                            Your personal spiritual archive of exegetical studies, sermon manuscripts, and reflections.
                        </p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-[#141416] border-gray-800 text-sm rounded-full"
                        />
                    </div>
                </div>

                {/* Library Tabs */}
                <Tabs defaultValue="studies" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-[#161616] border border-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="studies" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Saved Studies ({studies.length})
                        </TabsTrigger>
                        <TabsTrigger value="sermons" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Sermons ({sermons.length})
                        </TabsTrigger>
                        <TabsTrigger value="journal" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Journal ({journals.length})
                        </TabsTrigger>
                        <TabsTrigger value="prayers" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Answered ({answeredPrayers.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* STUDIES */}
                    <TabsContent value="studies" className="mt-6 space-y-4">
                        {filteredStudies.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <Bookmark className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">No Saved Studies Yet</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    When you study Scripture in SpiritOS, click "Save to Library" to preserve exegetical breakdowns here.
                                </p>
                                <Button onClick={() => router.push('/spirit-os')} className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs font-semibold">
                                    Open SpiritOS
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredStudies.map((study) => (
                                    <div key={study.id} className="p-5 rounded-xl border border-gray-800/80 bg-[#141416] space-y-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span className="text-[#D4AF37] font-semibold uppercase">{study.mode}</span>
                                                <span>{new Date(study.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-base font-semibold text-white mt-1">{study.title}</h4>
                                            <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{study.content}</p>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-800/60">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setEditingItem({
                                                        type: 'study',
                                                        id: study.id,
                                                        title: study.title || '',
                                                        content: study.content || '',
                                                        scripture_ref: study.scripture_ref || ''
                                                    })}
                                                    className="text-gray-500 hover:text-[#D4AF37] transition-colors text-xs"
                                                    title="Edit study"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudy(study.id)}
                                                    className="text-gray-500 hover:text-rose-400 transition-colors text-xs"
                                                    title="Delete study"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => router.push(`/spirit-os?prompt=${encodeURIComponent(study.query || study.title)}`)}
                                                className="text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                            >
                                                Study Further →
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* SERMONS */}
                    <TabsContent value="sermons" className="mt-6 space-y-4">
                        {filteredSermons.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <FileText className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">No Sermon Drafts Found</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    Craft sermon outlines and pulpit manuscripts in Sermon Studio.
                                </p>
                                <Button onClick={() => router.push('/studio')} className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs font-semibold">
                                    Open Sermon Studio
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredSermons.map((sermon) => (
                                    <div key={sermon.id} className="p-5 rounded-xl border border-gray-800/80 bg-[#141416] space-y-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span className="text-[#D4AF37] font-semibold">{sermon.content_json?.tone || "Expository"}</span>
                                                <span>{new Date(sermon.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-base font-semibold text-white mt-1">{sermon.title}</h4>
                                            {sermon.content_json?.scripture && (
                                                <p className="text-xs text-[#D4AF37]/80 font-serif italic">{sermon.content_json.scripture}</p>
                                            )}
                                        </div>
                                        <div className="pt-2 border-t border-gray-800/60 flex justify-end">
                                            <Button size="sm" onClick={() => handleOpenInStudio(sermon)} className="text-xs bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                                                Load in Studio →
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* JOURNAL */}
                    <TabsContent value="journal" className="mt-6 space-y-4">
                        {filteredJournals.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <BookOpen className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">Spiritual Journal is Clean</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    Record your prayers, personal revelations, and gratitude from the home dashboard or SpiritOS.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredJournals.map((entry) => (
                                    <div key={entry.id} className="p-5 rounded-xl border border-gray-800/80 bg-[#141416] space-y-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span className="text-indigo-400 font-semibold">{entry.scripture_ref || "Reflection"}</span>
                                                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-base font-semibold text-white mt-1">{entry.title}</h4>
                                            <p className="text-xs text-gray-400 mt-2 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-800/60 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setEditingItem({
                                                        type: 'journal',
                                                        id: entry.id,
                                                        title: entry.title || '',
                                                        content: entry.content || '',
                                                        scripture_ref: entry.scripture_ref || ''
                                                    })}
                                                    className="text-gray-500 hover:text-[#D4AF37] transition-colors text-xs"
                                                    title="Edit reflection"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteJournal(entry.id)}
                                                    className="text-gray-500 hover:text-rose-400 transition-colors text-xs"
                                                    title="Delete entry"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-gray-500">Reflection</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ANSWERED PRAYERS */}
                    <TabsContent value="prayers" className="mt-6 space-y-4">
                        {answeredPrayers.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <HeartHandshake className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">No Answered Testimonies Yet</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    Prayers marked answered in The Altar will be immortalized here as testimonies of God's faithfulness.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {answeredPrayers.map((prayer) => (
                                    <div key={prayer.id} className="p-5 rounded-xl border border-green-500/30 bg-[#121812] space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-green-400">
                                            <Badge variant="outline" className="border-green-500/40 text-green-400 text-[10px]">Answered Prayer</Badge>
                                            <span>{new Date(prayer.answered_at || prayer.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-base font-semibold text-white mt-1">{prayer.title}</h4>
                                        {prayer.scripture_ref && (
                                            <p className="text-xs text-[#D4AF37] font-serif italic">"{prayer.scripture_ref}"</p>
                                        )}
                                        {prayer.testimony && (
                                            <p className="text-xs text-gray-300 italic bg-green-950/20 p-2 rounded border border-green-900/30 mt-2">
                                                Testimony: {prayer.testimony}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* EDIT MODAL FOR STUDIES & JOURNALS */}
                <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
                    <DialogContent className="sm:max-w-xl bg-[#141416] border-gray-800 text-white">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-lg text-[#D4AF37]">
                                {editingItem?.type === 'study' ? "Edit Saved Study" : "Edit Journal Reflection"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-400">
                                Update your exegetical notes, personal reflections, or references. Changes persist immediately.
                            </DialogDescription>
                        </DialogHeader>

                        {editingItem && (
                            <div className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">Title</label>
                                    <Input
                                        value={editingItem.title}
                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                        placeholder="Title..."
                                        className="bg-black/50 border-gray-800 text-sm focus-visible:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">Scripture Reference (Optional)</label>
                                    <Input
                                        value={editingItem.scripture_ref || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, scripture_ref: e.target.value })}
                                        placeholder="e.g. John 1:1, Romans 8:28"
                                        className="bg-black/50 border-gray-800 text-sm focus-visible:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">Content</label>
                                    <Textarea
                                        value={editingItem.content}
                                        onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                                        rows={7}
                                        placeholder="Study notes or spiritual reflection..."
                                        className="bg-black/50 border-gray-800 text-sm focus-visible:ring-[#D4AF37] leading-relaxed resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="ghost"
                                onClick={() => setEditingItem(null)}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs font-semibold"
                            >
                                {isSavingEdit ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ShellLayout>
    );
}
