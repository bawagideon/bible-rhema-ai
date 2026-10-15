"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, Compass, ArrowRight, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NehemiahTimer } from "./nehemiah-timer";
import { QuickNoteWidget } from "./quick-note-widget";

export function DiscoveryRails() {
    const router = useRouter();

    const FIRST_STEPS = [
        {
            title: "Ask Scripture anything",
            description: "Bring any question, tension, or passage into real-time exegetical dialogue.",
            href: "/spirit-os",
            cta: "Open SpiritOS →",
            icon: BookOpen,
            color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30"
        },
        {
            title: "Bring it to the Altar",
            description: "Lay down your burdens with believers or record private answered prayers.",
            href: "/altar",
            cta: "Go to Altar →",
            icon: HeartHandshake,
            color: "text-rose-400 bg-rose-500/10 border-rose-500/30"
        },
        {
            title: "Be still",
            description: "Procedural prayer pads and Scripture soak in the secret presence of God.",
            href: "/sanctuary",
            cta: "Enter Sanctuary →",
            icon: Compass,
            color: "text-blue-400 bg-blue-500/10 border-blue-500/30"
        }
    ];

    return (
        <div className="space-y-10 py-2">
            {/* SECTION 1: Continue Your Walk (3 Cards) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                        Continue Your Walk
                    </h3>
                    <Link href="/library" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1">
                        Your Library <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {FIRST_STEPS.map((step, idx) => (
                        <Card
                            key={idx}
                            onClick={() => router.push(step.href)}
                            className="bg-[#121214] border-gray-800/80 hover:border-[#D4AF37]/50 transition-all cursor-pointer p-6 rounded-2xl flex flex-col justify-between group shadow-lg shadow-black/30"
                        >
                            <div className="space-y-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${step.color}`}>
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-base text-white group-hover:text-[#D4AF37] transition-colors">
                                        {step.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center text-xs text-[#D4AF37] font-semibold gap-1">
                                {step.cta}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* SECTION 2: Nehemiah Mode & Quick Note Widgets (Screen 1) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NehemiahTimer />
                <QuickNoteWidget />
            </div>
        </div>
    );
}
