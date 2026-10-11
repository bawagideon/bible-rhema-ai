"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRhema } from "@/lib/store/rhema-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, Settings, Download, Search, Info, Trash2, Library, X, Sparkles, Compass, ShieldCheck, ExternalLink, HelpCircle } from "lucide-react";
import { fetchSermons, SavedSermon } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export function RightPanel() {
    const pathname = usePathname();
    const { isRightPanelOpen, toggleRightPanel, setSermonToLoad, triggerPdfExport, lastSavedTimestamp, activeStudyContext } = useRhema();
    const [sermons, setSermons] = useState<SavedSermon[]>([]);
    const [loadingSermons, setLoadingSermons] = useState(false);

    useEffect(() => {
        if (isRightPanelOpen && pathname === "/studio") {
            loadSermons();
        }
    }, [isRightPanelOpen, pathname, lastSavedTimestamp]);

    const loadSermons = async () => {
        setLoadingSermons(true);
        const res = await fetchSermons();
        if (res.success && res.data) {
            setSermons(res.data);
        }
        setLoadingSermons(false);
    };

    // Dynamic Context Render
    const renderContent = () => {
        switch (pathname) {
            case "/spirit-os":
                if (activeStudyContext) {
                    return (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* 1. Passage in Focus */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5" /> Passage Focus
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37] uppercase">
                                        {activeStudyContext.mode}
                                    </Badge>
                                </div>
                                <div className="bg-card/40 p-3.5 rounded-lg border border-border/60 space-y-2">
                                    <h4 className="font-serif text-lg text-foreground font-semibold">
                                        {activeStudyContext.passageFocus}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {activeStudyContext.passageSummary}
                                    </p>
                                </div>
                            </div>

                            {/* 2. Key Terms & Original Languages */}
                            {activeStudyContext.keyTerms && activeStudyContext.keyTerms.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                                        <Search className="h-3.5 w-3.5" /> Lexicon & Original Words
                                    </h3>
                                    <div className="space-y-2.5">
                                        {activeStudyContext.keyTerms.map((term, i) => (
                                            <div key={i} className="bg-card/30 p-3 rounded-lg border border-border/50 space-y-1.5">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-serif text-sm font-medium text-foreground">{term.term}</span>
                                                    <span className="text-xs text-[#D4AF37] font-serif italic">{term.original}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {term.definition}
                                                </p>
                                                {term.occurrencesNote && (
                                                    <span className="inline-block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        {term.occurrencesNote}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Cross-References */}
                            {activeStudyContext.crossReferences && activeStudyContext.crossReferences.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                                        <Compass className="h-3.5 w-3.5" /> Supporting Scriptures
                                    </h3>
                                    <div className="space-y-2">
                                        {activeStudyContext.crossReferences.map((ref, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-card/20 border border-border/40 hover:border-[#D4AF37]/30 transition-colors space-y-1">
                                                <span className="font-serif font-semibold text-xs text-[#D4AF37] block">
                                                    {ref.reference}
                                                </span>
                                                <p className="text-xs text-muted-foreground line-clamp-3 italic">
                                                    "{ref.text}"
                                                </p>
                                                {ref.connection && (
                                                    <span className="text-[10px] text-muted-foreground/80 block pt-1 border-t border-border/20">
                                                        {ref.connection}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Follow-up Inquiries */}
                            {activeStudyContext.followUpQuestions && activeStudyContext.followUpQuestions.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" /> Continue Studying
                                    </h3>
                                    <div className="space-y-1.5">
                                        {activeStudyContext.followUpQuestions.map((q, i) => (
                                            <div key={i} className="p-2.5 rounded bg-muted/20 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                                                {q}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 5. Sources Grounding */}
                            <div className="pt-2 border-t border-border/30">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                                    <span>Scripture first. Grounded in canonical texts.</span>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Welcome / Ready state
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 text-center">
                            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest block">
                                Living Context Engine
                            </span>
                            <h4 className="font-serif text-base text-foreground font-medium">Scripture first. Always.</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Ask any theological question or enter a biblical passage to explore original language terms, cross-references, and historical covenant context here in real time.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Study Disciplines</h4>
                            <div className="p-3 rounded-lg bg-card/30 border border-border/40 space-y-1">
                                <span className="text-xs font-semibold text-[#D4AF37] block">Exegesis Mode</span>
                                <p className="text-[11px] text-muted-foreground">
                                    Original Greek & Hebrew lexical analysis, historical covenant setting, and expository doctrine.
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-card/30 border border-border/40 space-y-1">
                                <span className="text-xs font-semibold text-[#D4AF37] block">Devotion Mode</span>
                                <p className="text-[11px] text-muted-foreground">
                                    Contemplative heart reflection, gentle pastoral meditation, and practical walk in Christ.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case "/sanctuary":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 space-y-2">
                            <h4 className="font-serif text-[#D4AF37] font-medium text-sm">Sanctuary of Stillness</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter the secret place of meditation. Regulate your breathing, soak in God's promises, and quiet all noise.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" /> Spiritual Frequencies
                            </h3>
                            <div className="p-3 rounded bg-card/30 border border-border/40 space-y-1">
                                <span className="text-xs font-semibold text-foreground">432 Hz Peace Resonance</span>
                                <p className="text-[11px] text-muted-foreground">Harmonic tuning designed to calm anxious nervous systems and foster deep spiritual focus.</p>
                            </div>
                            <div className="p-3 rounded bg-card/30 border border-border/40 space-y-1">
                                <span className="text-xs font-semibold text-foreground">528 Hz Healing Tone</span>
                                <p className="text-[11px] text-muted-foreground">The ancient prayer frequency of restoration and spiritual renewal.</p>
                            </div>
                        </div>
                    </div>
                );

            case "/studio":
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                                <Library className="h-3 w-3" /> Sermon Library
                            </h3>

                            <div className="space-y-2">
                                {loadingSermons ? (
                                    <p className="text-xs text-muted-foreground">Loading manuscript library...</p>
                                ) : sermons.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No saved sermons yet.</p>
                                ) : (
                                    sermons.map((sermon) => (
                                        <div
                                            key={sermon.id}
                                            onClick={() => setSermonToLoad(sermon.content_json)}
                                            className="group p-3 rounded bg-card/20 hover:bg-card/60 cursor-pointer border border-transparent hover:border-[#D4AF37]/30 transition-all active:scale-95"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-serif font-medium text-sm text-foreground/90 group-hover:text-[#D4AF37] transition-colors">{sermon.title}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(sermon.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">
                                                {sermon.content_json?.scripture || "No scripture"}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border/20">
                            <Button
                                onClick={triggerPdfExport}
                                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold h-11 shadow-lg gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export as PDF
                            </Button>
                        </div>
                    </div>
                );

            case "/altar":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="space-y-3">
                            <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                                <Info className="h-3 w-3" /> Scripture Promises
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Anchor your intercessions upon God's covenant promises.
                            </p>

                            <div className="space-y-2.5">
                                {[
                                    { ref: "Psalm 103:2-3", text: "He heals all your diseases and redeems your life from the pit." },
                                    { ref: "Jeremiah 17:14", text: "Heal me, O Lord, and I shall be healed; save me, and I shall be saved." },
                                    { ref: "Philippians 4:6-7", text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God." },
                                    { ref: "James 5:16", text: "The effective, fervent prayer of a righteous man avails much." }
                                ].map((verse, i) => (
                                    <div key={i} className="group p-3 rounded-lg bg-card/20 border border-border/40 hover:border-[#D4AF37]/30 transition-all space-y-1">
                                        <span className="font-serif font-semibold text-xs text-[#D4AF37]">{verse.ref}</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            "{verse.text}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <h4 className="font-serif text-[#D4AF37] mb-2 font-medium">Scripture First</h4>
                            <p className="italic text-sm text-foreground/90">"Your word is a lamp to my feet and a light to my path." (Psalm 119:105)</p>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <h4 className="font-serif text-[#D4AF37] mb-2 font-medium">Living Companion</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">Select any tool from the sidebar to activate the context engine for that specific space.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <aside
            className={cn(
                "border-l border-white/10 bg-[#121212] transition-all duration-300 ease-in-out absolute md:relative right-0 h-full z-30 shadow-2xl md:shadow-none overflow-hidden flex flex-col",
                isRightPanelOpen
                    ? "w-[300px] translate-x-0 opacity-100 pointer-events-auto"
                    : "w-0 translate-x-[300px] opacity-0 pointer-events-none"
            )}
        >
            <div className="flex-none h-14 flex items-center justify-between px-6 border-b border-white/10 bg-[#121212]/50 backdrop-blur">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {pathname === '/spirit-os' ? 'Theological Insight' :
                        pathname === '/studio' ? 'Publishing Settings' :
                            pathname === '/altar' ? 'Scripture Bank' : 'Context'}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white md:hidden" onClick={toggleRightPanel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6">
                    {renderContent()}
                </div>
            </ScrollArea>
        </aside>
    );
}
