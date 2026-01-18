"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Star, Zap } from "lucide-react";
import Image from "next/image";

// Mock Data
const CONTINUING_ITEMS = [
    { title: "Day 3: The 40-Day Fast", progress: 12, color: "bg-purple-500/10 text-purple-400" },
    { title: "Reading: Book of Acts", progress: 45, color: "bg-blue-500/10 text-blue-400" },
    { title: "Goal: 1 Hour Prayer", progress: 80, color: "bg-emerald-500/10 text-emerald-400" },
];

const RECOMMENDED_ITEMS = [
    { title: "Overcoming Anxiety", subtitle: "7-Day Guide", icon: Zap },
    { title: "Financial Peace", subtitle: "Biblical Wisdom", icon: Star },
    { title: "Marriage Restoration", subtitle: "Prayer Plan", icon: Flame },
];

export function DiscoveryRails() {
    return (
        <div className="space-y-8 py-4">
            {/* SECTION 1: Continue Your Walk */}
            <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold px-4 md:px-0">
                    Continue Your Walk
                </h3>
                <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                    <div className="flex w-max space-x-4 px-4 md:px-0 pb-4">
                        {CONTINUING_ITEMS.map((item, i) => (
                            <Card key={i} className="w-[200px] md:w-[250px] bg-card/40 border-border/50 backdrop-blur-sm hover:bg-card/60 transition-colors cursor-pointer">
                                <CardContent className="p-4 space-y-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/70" style={{ width: `${item.progress}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.progress}% Complete</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {/* SECTION 2: Recommended For You */}
            <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold px-4 md:px-0">
                    Recommended for You
                </h3>
                <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                    <div className="flex w-max space-x-4 px-4 md:px-0 pb-4">
                        {RECOMMENDED_ITEMS.map((item, i) => (
                            <Card key={i} className="w-[180px] md:w-[220px] aspect-[4/3] bg-card/40 border-border/50 backdrop-blur-sm hover:border-[#D4AF37]/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-2 group">
                                <item.icon className="w-8 h-8 text-muted-foreground group-hover:text-[#D4AF37] transition-colors" />
                                <div>
                                    <h4 className="font-semibold text-sm">{item.title}</h4>
                                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                </div>
                            </Card>
                        ))}
                        {/* Fake Content spacer */}
                        <div className="w-[50px]" />
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
}
