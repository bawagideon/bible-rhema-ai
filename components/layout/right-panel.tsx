"use client";

import { usePathname } from "next/navigation";
import { useRhema } from "@/lib/store/rhema-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, Settings, Download, Search, Info } from "lucide-react";

export function RightPanel() {
    const pathname = usePathname();
    const { isRightPanelOpen } = useRhema();

    // "The Chameleon" Logic
    const renderContent = () => {
        switch (pathname) {
            case "/spirit-os":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                                <Search className="h-3 w-3" /> Word Study
                            </h3>
                            <div className="bg-card/40 p-4 rounded-lg border border-border/50 space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <h4 className="font-serif text-xl">Peace</h4>
                                    <span className="text-xs text-muted-foreground italic">Gk. Eirene</span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    To join, to set at one again. Not just the absence of conflict, but wholeness.
                                </p>
                                <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded w-fit">
                                    Found 92 times in NT
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                                <BookOpen className="h-3 w-3" /> Cross Refs
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li className="p-3 rounded bg-card/20 hover:bg-card/60 cursor-pointer transition-colors border border-transparent hover:border-primary/20">
                                    <span className="font-semibold block mb-1">John 14:27</span>
                                    <span className="text-muted-foreground text-xs line-clamp-2">"Peace I leave with you; my peace I give you. I do not give to you as the world gives."</span>
                                </li>
                                <li className="p-3 rounded bg-card/20 hover:bg-card/60 cursor-pointer transition-colors border border-transparent hover:border-primary/20">
                                    <span className="font-semibold block mb-1">Colossians 3:15</span>
                                    <span className="text-muted-foreground text-xs line-clamp-2">"Let the peace of Christ rule in your hearts, since as members of one body you were called to peace."</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                );

            case "/studio":
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                                <Settings className="h-3 w-3" /> Format Options
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded bg-card/20 border border-border/50">
                                    <span className="text-sm">Paper Size</span>
                                    <span className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded">A4 (210x297)</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded bg-card/20 border border-border/50">
                                    <span className="text-sm">Theme</span>
                                    <span className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded">Classic White</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-border/20">
                            <Button className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold h-12 shadow-lg gap-2">
                                <Download className="h-4 w-4" />
                                Export as PDF
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground mt-3">
                                Ready for print or digital distribution.
                            </p>
                        </div>
                    </div>
                );

            case "/altar":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                                <Info className="h-3 w-3" /> Scripture Bank
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Drag these verses into your journal for reflection.
                            </p>

                            <div className="space-y-3">
                                {["Psalm 103:2-3", "Jeremiah 17:14", "Isaiah 53:5", "James 5:15"].map((verse, i) => (
                                    <div key={i} className="group p-3 rounded bg-card/20 hover:bg-card/60 cursor-move border border-transparent hover:border-primary/20 transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-serif font-medium text-primary">{verse}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            "Heals all your diseases, redeems your life from the pit..."
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
                            <h4 className="font-serif text-primary mb-2">Daily Verse</h4>
                            <p className="italic text-sm">"In the beginning was the Word, and the Word was with God, and the Word was God." (John 1:1)</p>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <h4 className="font-serif text-primary mb-2">Quick Reference</h4>
                            <p className="text-sm text-muted-foreground">Select a tool from the sidebar to see specific insights here.</p>
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
                    ? "w-[300px] translate-x-0 opacity-100"
                    : "w-0 translate-x-[300px] md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
            )}
        >
            <div className="flex-none h-14 flex items-center px-6 border-b border-white/10 bg-[#121212]/50 backdrop-blur">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {pathname === '/spirit-os' ? 'Theological Insight' :
                        pathname === '/studio' ? 'Publishing Settings' :
                            pathname === '/altar' ? 'Scripture Bank' : 'Context'}
                </span>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6">
                    {renderContent()}
                </div>
            </ScrollArea>
        </aside>
    );
}
