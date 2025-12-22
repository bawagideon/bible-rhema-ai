"use client";

import { ShellLayout } from "@/components/layout/shell-layout";
import { DailyRhemaCard } from "@/components/dashboard/daily-rhema-card";
import { SpiritualMoodGrid } from "@/components/dashboard/spiritual-mood-grid";
import { ChallengeTracker } from "@/components/dashboard/challenge-tracker";

// Mock Data
const MOCK_DATA = {
  date: "Friday, 19 Dec",
  scripture: "Now faith is the substance of things hoped for, the evidence of things not seen.",
  reference: "Hebrews 11:1 (KJV)",
  rhema: "Faith isn't just hope; it is the physical title deed of your spiritual reality. Walking in faith means operating as if the promise is already in your possession.",
};

export default function Home() {
  return (
    <ShellLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">

        {/* ROW 1: Hero Card */}
        <section>
          <DailyRhemaCard
            date={MOCK_DATA.date}
            scripture={MOCK_DATA.scripture}
            reference={MOCK_DATA.reference}
            rhema={MOCK_DATA.rhema}
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
