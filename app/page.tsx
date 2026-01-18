"use client";

import { ShellLayout } from "@/components/layout/shell-layout";
import { HeroStream } from "@/components/dashboard/hero-stream";
import { DiscoveryRails } from "@/components/dashboard/discovery-rails";
import { WalkWithGodStreak } from "@/components/dashboard/streak";

export default function Home() {
  return (
    <ShellLayout>
      <div className="flex-1 space-y-12 p-4 md:p-8 pt-6 max-w-5xl mx-auto pb-24">
        {/* Header Greeting & Streak */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-tight font-serif text-muted-foreground">
              Shalom, Pilgrim.
            </h1>
          </div>
          <WalkWithGodStreak days={12} />
        </div>

        {/* THE HERO STREAM (Context Aware) */}
        <section className="min-h-[300px] md:min-h-[400px]">
          <HeroStream />
        </section>

        {/* DISCOVERY RAILS (Netflix Style) */}
        <section>
          <DiscoveryRails />
        </section>
      </div>
    </ShellLayout>
  );
}
