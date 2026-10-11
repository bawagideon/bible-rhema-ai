"use client";

import { useEffect, useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { HeroStream } from "@/components/dashboard/hero-stream";
import { DiscoveryRails } from "@/components/dashboard/discovery-rails";
import { WalkWithGodStreak } from "@/components/dashboard/streak";
import { useUser } from "@clerk/nextjs";

export default function Home() {
    const { user } = useUser();
    const [streakDays, setStreakDays] = useState(0);

    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const res = await fetch("/api/user/stats");
                const data = await res.json();
                if (data && typeof data.streak === "number") {
                    setStreakDays(data.streak);
                }
            } catch (e) {
                console.error("Error fetching user stats:", e);
            }
        };

        fetchUserStats();
    }, [user]);

    const greetingName = user?.firstName ? `Shalom, ${user.firstName}.` : "Shalom, Pilgrim.";

    return (
        <ShellLayout>
            <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 max-w-5xl mx-auto pb-24">
                {/* Header Greeting & Real Dynamic Streak */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif font-medium tracking-tight text-white">
                            {greetingName}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Welcome into the Sanctuary. May Christ's peace rule in your heart.
                        </p>
                    </div>
                    <WalkWithGodStreak days={streakDays} />
                </div>

                {/* THE HERO STREAM (Context Aware) */}
                <section className="min-h-[280px] md:min-h-[350px]">
                    <HeroStream />
                </section>

                {/* REAL CONTINUATION & SPIRITUAL FOCUS */}
                <section>
                    <DiscoveryRails />
                </section>
            </div>
        </ShellLayout>
    );
}
