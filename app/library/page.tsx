"use client";

import { useEffect, useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { fetchSermons, SavedSermon } from "@/lib/api";
import { useRhema } from "@/lib/store/rhema-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, Search, FileText, ArrowUpRight, Sparkles, Plus, BookOpen, Trash2, HeartHandshake, Bookmark } from "lucide-react";
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
                                            <button onClick={() => handleDeleteStudy(study.id)} className="text-gray-500 hover:text-rose-400 text-xs">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
                                        <div className="pt-2 border-t border-gray-800/60 flex justify-end">
                                            <button onClick={() => handleDeleteJournal(entry.id)} className="text-gray-500 hover:text-rose-400 text-xs">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
            </div>
        </ShellLayout>
    );
}
