"use client";

import { useEffect, useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { fetchSermons, SavedSermon } from "@/lib/api";
import { useRhema } from "@/lib/store/rhema-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Library, Search, FileText, ArrowUpRight, Sparkles, Plus, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
    const router = useRouter();
    const { setSermonToLoad, userRole } = useRhema();
    const [sermons, setSermons] = useState<SavedSermon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadSermons();
    }, []);

    const loadSermons = async () => {
        setLoading(true);
        const res = await fetchSermons();
        if (res.success && res.data) {
            setSermons(res.data);
        }
        setLoading(false);
    };

    const handleOpenInStudio = (sermon: SavedSermon) => {
        setSermonToLoad(sermon.content_json);
        router.push("/studio");
    };

    const filteredSermons = sermons.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.content_json?.scripture && s.content_json.scripture.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <ShellLayout>
            <div className="flex-1 space-y-8 p-6 md:p-10 max-w-6xl mx-auto pb-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight">Theological Library</h1>
                            <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-xs">
                                {userRole} Vault
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Your personal collection of sermon outlines, exegetical studies, and theological notes.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push('/studio')}
                            className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Sermon Outline
                        </Button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search manuscripts by title or scripture..."
                            className="pl-10 bg-card/40 border-border/60"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-xl bg-card/20 animate-pulse border border-border/30" />
                        ))}
                    </div>
                ) : filteredSermons.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl space-y-4">
                        <Library className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
                        <div className="space-y-1">
                            <h3 className="font-serif text-xl font-medium">Your Library is Empty</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                Save manuscripts in Sermon Studio or generate an outline with AI to build your library.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/studio')}
                            variant="outline"
                            className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                            Open Sermon Studio
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSermons.map((sermon) => {
                            const scripture = sermon.content_json?.scripture || "Unassigned Passage";
                            const tone = sermon.content_json?.tone || "Theological";

                            return (
                                <Card
                                    key={sermon.id}
                                    className="border-border/60 bg-card/40 hover:bg-card/70 hover:border-[#D4AF37]/40 transition-all cursor-pointer group flex flex-col justify-between"
                                    onClick={() => handleOpenInStudio(sermon)}
                                >
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <Badge variant="secondary" className="text-[10px] font-mono uppercase bg-muted/60">
                                                {tone}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(sermon.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                                                {sermon.title || "Untitled Sermon"}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {scripture}
                                            </p>
                                        </div>

                                        <div className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed pt-2">
                                            {sermon.content_json?.notes
                                                ? sermon.content_json.notes.replace(/<[^>]*>?/gm, ' ').slice(0, 150) + "..."
                                                : "No body content yet."}
                                        </div>

                                        <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-[#D4AF37] group-hover:underline">
                                            <span>Open in Divine Editor</span>
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </ShellLayout>
    );
}
