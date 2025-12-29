"use client";

import { ShellLayout } from "@/components/layout/shell-layout";
import { DailyRhemaCard } from "@/components/dashboard/daily-rhema-card";
import { EmotionalTriage } from "@/components/dashboard/emotional-triage";
import { WalkWithGodStreak } from "@/components/dashboard/streak";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <ShellLayout>
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif">Morning Manna</h2>
            <p className="text-muted-foreground">
              Daily bread for your spiritual journey.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <WalkWithGodStreak days={12} /> {/* Mock Data */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Main Feed */}
          <div className="md:col-span-8 space-y-6">
            <DailyRhemaCard />
            {/* Future: Feed Items */}
          </div>

          {/* RIGHT COLUMN: Widgets */}
          <div className="md:col-span-4 space-y-6">
            <EmotionalTriage />

            <div className="p-4 rounded-xl border bg-card/50">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-widest">
                Focus Timer
              </h3>
              <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                Nehemiah Mode (Coming Soon)
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
