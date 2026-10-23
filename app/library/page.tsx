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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Library, Search, FileText, ArrowRight, Sparkles, BookOpen, Trash2,
    HeartHandshake, Bookmark, Pencil, Clock, Filter, ArrowUpRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LibraryLoadingSkeleton, EmptyFirstVisit, ConfirmDeleteDialog } from "@/components/system";

export default function LibraryPage() {
    const router = useRouter();
    const { setSermonToLoad, userRole } = useRhema();

    const [sermons, setSermons] = useState<SavedSermon[]>([]);
    const [studies, setStudies] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [answeredPrayers, setAnsweredPrayers] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBook, setSelectedBook] = useState("all");
    const [sortBy, setSortBy] = useState("recent");
    const [activeTab, setActiveTab] = useState("all");

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        type: 'study' | 'journal' | 'sermon';
        id: string;
        title: string;
    }>({
        open: false,
        type: 'study',
        id: '',
        title: '',
    });

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

    const handleOpenInStudio = (sermon: SavedSermon | any) => {
        if (sermon.content_json) {
            setSermonToLoad(sermon.content_json);
        } else {
            setSermonToLoad({
                title: sermon.title || "The Vine and the Branches",
                scripture: sermon.scripture || "John 15:1-8",
                tone: "Expository",
                notes: sermon.notes || "<h3>Introduction: Abiding in Christ</h3><p>Jesus reveals the secret of spiritual fruitfulness: remaining connected to the True Vine.</p>",
                context: []
            });
        }
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

    const handleDeleteSermon = async (id: string) => {
        try {
            await fetch(`/api/sermons?id=${id}`, { method: 'DELETE' });
            setSermons(prev => prev.filter(s => s.id !== id));
            toast.success("Sermon draft removed");
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

    // Featured latest draft for the "CONTINUE WHERE YOU LEFT OFF" hero card
    const latestDraft: any = sermons[0] || {
        id: "featured-vine",
        title: "The Vine and the Branches",
        scripture: "John 15:1-8",
        progress: "68% written",
        summary: "3 points drafted · 1 illustration needed",
        content_json: {
            title: "The Vine and the Branches",
            scripture: "John 15:1-8",
            tone: "Expository",
            notes: "<h3>Point 1: The Vinedresser's Care</h3><p>Every branch in Me that does not bear fruit He takes away; and every branch that bears fruit He prunes.</p>",
            context: []
        }
    };

    const q = searchQuery.toLowerCase();

    // Filters
    const filteredStudies = studies.filter(s => {
        const matchesQuery = !q || s.title?.toLowerCase().includes(q) || s.content?.toLowerCase().includes(q) || s.scripture_ref?.toLowerCase().includes(q);
        const matchesBook = selectedBook === "all" || s.scripture_ref?.toLowerCase().includes(selectedBook.toLowerCase());
        return matchesQuery && matchesBook;
    });

    const filteredSermons = sermons.filter(s => {
        const matchesQuery = !q || s.title?.toLowerCase().includes(q) || s.content_json?.scripture?.toLowerCase().includes(q);
        const matchesBook = selectedBook === "all" || s.content_json?.scripture?.toLowerCase().includes(selectedBook.toLowerCase());
        return matchesQuery && matchesBook;
    });

    const filteredJournals = journals.filter(j => {
        const matchesQuery = !q || j.title?.toLowerCase().includes(q) || j.content?.toLowerCase().includes(q) || j.scripture_ref?.toLowerCase().includes(q);
        const matchesBook = selectedBook === "all" || j.scripture_ref?.toLowerCase().includes(selectedBook.toLowerCase());
        return matchesQuery && matchesBook;
    });

    const filteredAnswered = answeredPrayers.filter(p => {
        const matchesQuery = !q || p.title?.toLowerCase().includes(q) || p.testimony?.toLowerCase().includes(q) || p.scripture_ref?.toLowerCase().includes(q);
        return matchesQuery;
    });

    const totalCount = studies.length + sermons.length + journals.length + answeredPrayers.length;

    // Combined all items for "All" tab
    const allItems = [
        ...filteredSermons.map(s => ({ ...s, itemType: 'sermon', date: new Date(s.created_at) })),
        ...filteredStudies.map(s => ({ ...s, itemType: 'study', date: new Date(s.created_at) })),
        ...filteredJournals.map(j => ({ ...j, itemType: 'journal', date: new Date(j.created_at) })),
        ...filteredAnswered.map(p => ({ ...p, itemType: 'answered', date: new Date(p.answered_at || p.created_at) }))
    ].sort((a, b) => {
        if (sortBy === 'recent') return b.date.getTime() - a.date.getTime();
        if (sortBy === 'oldest') return a.date.getTime() - b.date.getTime();
        return (a.title || '').localeCompare(b.title || '');
    });

    const handleConfirmDelete = async () => {
        if (deleteDialog.type === 'study') await handleDeleteStudy(deleteDialog.id);
        else if (deleteDialog.type === 'journal') await handleDeleteJournal(deleteDialog.id);
        else if (deleteDialog.type === 'sermon') await handleDeleteSermon(deleteDialog.id);
    };

    if (loading) {
        return (
            <ShellLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto pb-28 font-sans">
                    <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Your Library</h1>
                        <p className="text-gray-400 text-xs md:text-sm">Loading your saved studies, manuscripts, and notes...</p>
                    </div>
                    <LibraryLoadingSkeleton />
                </div>
            </ShellLayout>
        );
    }

    return (
        <ShellLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto pb-28 font-sans">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Your Library</h1>
                            <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] text-xs uppercase tracking-wider font-semibold">
                                {userRole} Vault
                            </Badge>
                        </div>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                            Your personal spiritual archive of exegetical studies, sermon manuscripts, and answered prayers.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push('/studio')}
                            className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs font-semibold"
                        >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            New Sermon Draft
                        </Button>
                    </div>
                </div>

                {/* SCREEN 9: CONTINUE WHERE YOU LEFT OFF HERO BANNER */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171717] via-[#141416] to-[#1a1813] border border-[#D4AF37]/30 p-6 md:p-7 shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">
                                    Continue where you left off
                                </span>
                                <span className="text-gray-600">·</span>
                                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-0 text-[10px] font-mono">
                                    {latestDraft.progress || "Draft in progress"}
                                </Badge>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                                {latestDraft.title || "The Vine and the Branches"}
                            </h2>
                            <p className="text-sm text-gray-300 font-serif italic flex items-center gap-2">
                                <span>{latestDraft.scripture || (latestDraft.content_json?.scripture) || "John 15:1-8"}</span>
                                <span className="text-gray-600 not-italic font-sans text-xs">·</span>
                                <span className="text-xs text-gray-400 not-italic font-sans">
                                    {latestDraft.summary || "3 points drafted · 1 illustration needed"}
                                </span>
                            </p>
                        </div>

                        <Button
                            onClick={() => handleOpenInStudio(latestDraft)}
                            className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs md:text-sm px-5 py-5 shadow-lg shadow-[#D4AF37]/20 shrink-0 flex items-center gap-2"
                        >
                            Open in Studio
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* SEARCH & FILTERS BAR */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by scripture, title, topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#121214] border-gray-800 text-sm rounded-xl text-white placeholder:text-gray-500 focus-visible:ring-[#D4AF37]"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select value={selectedBook} onValueChange={setSelectedBook}>
                            <SelectTrigger className="w-full md:w-44 bg-[#121214] border-gray-800 text-xs text-gray-300 rounded-xl">
                                <SelectValue placeholder="All books" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141416] border-gray-800 text-gray-200 text-xs">
                                <SelectItem value="all">All books</SelectItem>
                                <SelectItem value="Genesis">Genesis</SelectItem>
                                <SelectItem value="Psalms">Psalms</SelectItem>
                                <SelectItem value="Proverbs">Proverbs</SelectItem>
                                <SelectItem value="Isaiah">Isaiah</SelectItem>
                                <SelectItem value="Matthew">Matthew</SelectItem>
                                <SelectItem value="John">John</SelectItem>
                                <SelectItem value="Romans">Romans</SelectItem>
                                <SelectItem value="Corinthians">Corinthians</SelectItem>
                                <SelectItem value="Hebrews">Hebrews</SelectItem>
                                <SelectItem value="Revelation">Revelation</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-36 bg-[#121214] border-gray-800 text-xs text-gray-300 rounded-xl">
                                <SelectValue placeholder="Recent first" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141416] border-gray-800 text-gray-200 text-xs">
                                <SelectItem value="recent">Recent first</SelectItem>
                                <SelectItem value="oldest">Oldest first</SelectItem>
                                <SelectItem value="title">A to Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* LIBRARY TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-[#141416] border border-gray-800 p-1 rounded-xl">
                        <TabsTrigger value="all" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            All ({totalCount})
                        </TabsTrigger>
                        <TabsTrigger value="studies" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs font-medium">
                            Studies ({studies.length})
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

                    {/* ALL ITEMS VIEW */}
                    <TabsContent value="all" className="mt-6 space-y-4">
                        {allItems.length === 0 ? (
                            <EmptyFirstVisit
                                title="Your library is waiting"
                                description="Save a study, write a note or add a prayer and it will appear here."
                                actionText="Start your first study"
                                actionHref="/spirit-os"
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allItems.map((item: any) => (
                                    <div key={`${item.itemType}-${item.id}`} className="p-5 rounded-xl border border-gray-800 bg-[#141416] hover:border-gray-700 transition-all space-y-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                {item.itemType === 'sermon' && (
                                                    <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-0 text-[10px] font-semibold">
                                                        SERMON · DRAFT
                                                    </Badge>
                                                )}
                                                {item.itemType === 'study' && (
                                                    <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[10px] font-semibold">
                                                        STUDY · EXEGESIS
                                                    </Badge>
                                                )}
                                                {item.itemType === 'journal' && (
                                                    <Badge className="bg-purple-500/15 text-purple-300 border-0 text-[10px] font-semibold">
                                                        JOURNAL ENTRY
                                                    </Badge>
                                                )}
                                                {item.itemType === 'answered' && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px] font-semibold">
                                                        ANSWERED PETITION
                                                    </Badge>
                                                )}
                                                <span className="text-gray-500">{new Date(item.created_at || item.answered_at).toLocaleDateString()}</span>
                                            </div>

                                            <h4 className="text-base font-semibold text-white mt-2">
                                                {item.title || "Untitled Entry"}
                                            </h4>

                                            {(item.scripture_ref || item.content_json?.scripture) && (
                                                <p className="text-xs text-[#D4AF37] font-serif italic mt-0.5">
                                                    {item.scripture_ref || item.content_json?.scripture}
                                                </p>
                                            )}

                                            <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                                                {item.content || item.testimony || (item.content_json?.notes?.replace(/<[^>]*>?/gm, '')) || "No content preview"}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-800/80">
                                            <span className="text-[11px] text-gray-500 font-mono">
                                                {item.itemType === 'sermon' ? 'In manuscript' : item.itemType === 'study' ? 'Expository breakdown' : 'Spiritual walk'}
                                            </span>
                                            {item.itemType === 'sermon' ? (
                                                <Button size="sm" onClick={() => handleOpenInStudio(item)} className="text-xs bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold">
                                                    Open in Studio →
                                                </Button>
                                            ) : item.itemType === 'study' ? (
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/spirit-os?prompt=${encodeURIComponent(item.query || item.title)}`)} className="text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10">
                                                    Study Further →
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-gray-500">Archived</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* STUDIES TAB */}
                    <TabsContent value="studies" className="mt-6 space-y-4">
                        {filteredStudies.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <Bookmark className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">No Saved Studies Found</h3>
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
                                                <span className="text-[#D4AF37] font-semibold uppercase">{study.mode || "EXEGESIS"}</span>
                                                <span>{new Date(study.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-base font-semibold text-white mt-1">{study.title}</h4>
                                            {study.scripture_ref && (
                                                <p className="text-xs text-[#D4AF37]/80 font-serif italic mt-0.5">{study.scripture_ref}</p>
                                            )}
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
                                                    onClick={() => setDeleteDialog({
                                                        open: true,
                                                        type: 'study',
                                                        id: study.id,
                                                        title: study.title || 'Expository Study',
                                                    })}
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

                    {/* SERMONS TAB */}
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
                                                <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-0 text-[10px]">
                                                    {sermon.content_json?.tone || "Expository"}
                                                </Badge>
                                                <span>{new Date(sermon.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-base font-semibold text-white mt-1.5">{sermon.title}</h4>
                                            {sermon.content_json?.scripture && (
                                                <p className="text-xs text-[#D4AF37] font-serif italic">{sermon.content_json.scripture}</p>
                                            )}
                                        </div>
                                        <div className="pt-2 border-t border-gray-800/60 flex justify-between items-center">
                                            <button
                                                onClick={() => setDeleteDialog({
                                                    open: true,
                                                    type: 'sermon',
                                                    id: sermon.id,
                                                    title: sermon.title || 'Sermon Draft',
                                                })}
                                                className="text-gray-500 hover:text-rose-400 transition-colors text-xs"
                                                title="Delete sermon"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Button size="sm" onClick={() => handleOpenInStudio(sermon)} className="text-xs bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold">
                                                Load in Studio →
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* JOURNAL TAB */}
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
                                                    onClick={() => setDeleteDialog({
                                                        open: true,
                                                        type: 'journal',
                                                        id: entry.id,
                                                        title: entry.title || 'Journal Entry',
                                                    })}
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

                    {/* ANSWERED PRAYERS TAB */}
                    <TabsContent value="prayers" className="mt-6 space-y-4">
                        {filteredAnswered.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800/80 rounded-2xl bg-[#121212] space-y-3">
                                <HeartHandshake className="w-10 h-10 text-gray-500 mx-auto" />
                                <h3 className="font-serif text-lg font-semibold text-white">No Answered Testimonies Yet</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    Prayers marked answered in The Altar will be immortalized here as testimonies of God's faithfulness.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredAnswered.map((prayer) => (
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

            {/* Confirm Before Deleting Dialog */}
            <ConfirmDeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
                title={`Delete this ${deleteDialog.type}?`}
                itemName={deleteDialog.title}
                itemType={deleteDialog.type}
                onConfirm={handleConfirmDelete}
            />
        </ShellLayout>
    );
}
