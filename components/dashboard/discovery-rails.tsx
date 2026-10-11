"use client";

import { useEffect, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Star, Zap, BookOpen, Compass, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RecentItem {
    id: string;
    title: string;
    type: string;
    href: string;
    date: string;
}

export function DiscoveryRails() {
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/user/stats");
                const data = await res.json();
                if (data && data.recentItems) {
                    setRecentItems(data.recentItems);
                }
            } catch (e) {
                console.error("Error loading user walk stats:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const FIRST_STEPS = [
        {
            title: "SpiritOS Exegesis",
            description: "Deep verse breakdown with original Hebrew & Greek",
            href: "/spirit-os",
            icon: BookOpen,
            color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30"
        },
        {
            title: "Community Altar",
            description: "Join believers in intercession or lay a personal request",
            href: "/altar",
            icon: HeartHandshake,
            color: "text-rose-400 bg-rose-500/10 border-rose-500/30"
        },
        {
            title: "Peaceful Sanctuary",
            description: "Soak in ambient procedural soundscapes & scripture",
            href: "/sanctuary",
            icon: Compass,
            color: "text-blue-400 bg-blue-500/10 border-blue-500/30"
        }
    ];

    return (
        <div className="space-y-8 py-4">
            {/* SECTION 1: Continue Your Walk */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4 md:px-0">
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">
                        Continue Your Walk
                    </h3>
                    {recentItems.length > 0 && (
                        <Link href="/library" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                {recentItems.length > 0 ? (
                    <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                        <div className="flex w-max space-x-4 px-4 md:px-0 pb-4">
                            {recentItems.map((item) => (
                                <Card
                                    key={item.id}
                                    onClick={() => router.push(item.href)}
                                    className="w-[240px] md:w-[280px] bg-card/40 border-border/50 backdrop-blur-sm hover:border-[#D4AF37]/50 hover:bg-card/70 transition-all cursor-pointer"
                                >
                                    <CardContent className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                                                {item.type}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-sm truncate text-white">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            Click to resume <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-0">
                        {FIRST_STEPS.map((step, idx) => (
                            <Card
                                key={idx}
                                onClick={() => router.push(step.href)}
                                className="bg-[#121212] border-gray-800/80 hover:border-[#D4AF37]/50 transition-all cursor-pointer p-5 flex flex-col justify-between group"
                            >
                                <div className="space-y-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${step.color}`}>
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-serif font-semibold text-white group-hover:text-[#D4AF37] transition-colors">{step.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                                <div className="pt-4 flex items-center text-xs text-[#D4AF37] font-medium gap-1">
                                    Begin <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 2: Spiritual Focus Guides */}
            <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold px-4 md:px-0">
                    Spiritual Focus Guides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-0">
                    <Card
                        onClick={() => router.push("/spirit-os?prompt=How do I overcome anxiety through biblical prayer?")}
                        className="bg-[#141414] border-gray-800 hover:border-blue-500/40 transition-all cursor-pointer p-5 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-white group-hover:text-blue-300">Overcoming Anxiety</h4>
                                <p className="text-xs text-muted-foreground">Philippians 4 • Expository Study</p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        onClick={() => router.push("/spirit-os?prompt=What is God's covenant wisdom for work and stewardship?")}
                        className="bg-[#141414] border-gray-800 hover:border-amber-500/40 transition-all cursor-pointer p-5 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Star className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-white group-hover:text-amber-300">Kingdom Stewardship</h4>
                                <p className="text-xs text-muted-foreground">Deuteronomy 8 • Biblical Wisdom</p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        onClick={() => router.push("/spirit-os?prompt=How does the Holy Spirit restore broken relationships and families?")}
                        className="bg-[#141414] border-gray-800 hover:border-rose-500/40 transition-all cursor-pointer p-5 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <Flame className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-white group-hover:text-rose-300">Family & Restoration</h4>
                                <p className="text-xs text-muted-foreground">Ephesians 4 • Prayer Walk</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
