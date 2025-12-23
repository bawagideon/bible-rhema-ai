"use client";

import { ShellLayout } from "@/components/layout/shell-layout";
import { DailyRhemaCard } from "@/components/dashboard/daily-rhema-card";
import { SpiritualMoodGrid } from "@/components/dashboard/spiritual-mood-grid";
import { ChallengeTracker } from "@/components/dashboard/challenge-tracker";

// Mock Data
const MOCK_DATA = {
  //   ... (Removed)
};

export default function Home() {
  return (
    <ShellLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">

        {/* ROW 1: Hero Card */}
        <section>
          <DailyRhemaCard
            className="w-full min-h-[300px]"
          />
        </section>

        {/* ROW 2: Interactive Grid & Tracker */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <SpiritualMoodGrid className="lg:col-span-3 min-h-[250px]" />
          <ChallengeTracker className="lg:col-span-2 min-h-[250px]" />
        </section>

      </div>
    </ShellLayout>
  );
}
