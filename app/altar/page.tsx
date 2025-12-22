"use client";

import { ShellLayout } from "@/components/layout/shell-layout";
import { PrayerWall } from "@/components/altar/prayer-wall";
import { RhemaJournal } from "@/components/altar/rhema-journal";

export default function AltarPage() {
    return (
        <ShellLayout>
            <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">
                {/* Left: Prayer Wall */}
                <div className="w-full md:w-[40%] h-full md:border-r border-border z-10 box-border">
                    <PrayerWall />
                </div>

                {/* Right: Journal */}
                <div className="hidden md:block w-full md:w-[60%] h-full relative">
                    <RhemaJournal />
                </div>
            </div>
        </ShellLayout>
    );
}
