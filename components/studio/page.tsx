"use client";

import { useState } from "react";
import dynamic from "next/dynamic"; // 1. Add this import
import { ShellLayout } from "@/components/layout/shell-layout";
import { SermonBuilder, type SermonData } from "@/components/studio/sermon-builder";

// 2. Quarantine the Preview Component (Updated for Default Export)
const LivePreview = dynamic(
    () => import("@/components/studio/live-preview"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center text-white/50 bg-[#1c1c1c]">
                Loading Studio...
            </div>
        )
    }
);

export default function StudioPage() {
    const [sermonData, setSermonData] = useState<SermonData>({
        title: "",
        scripture: "",
        tone: "Theological",
        notes: "",
    });

    const handleGenerate = () => {
        // Mock AI Generation
        const aiContent = `I. Introduction: The Weight of Glory
   - Defining glory not just as brightness, but as 'kabod' – heavy, weighty significance.
   - The contrast between our light afflictions and the eternal weight of glory (2 Cor 4:17).

II. The Conflict: Flesh vs. Spirit
   - The flesh seeks immediate gratification; the spirit seeks eternal satisfaction.
   - Galatians 5:17 - the war within.

III. The Resolution: Walking in Grace
   - Grace is not just pardon; it is power.

Conclusion:
   - Let us not faint. The weight is building something in us that will last forever.`;

        setSermonData(prev => ({ ...prev, notes: aiContent }));
    };

    return (
        <ShellLayout>
            <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
                {/* Left: The Builder */}
                <div className="w-full md:w-[40%] h-full z-10 box-border">
                    <SermonBuilder
                        data={sermonData}
                        onChange={setSermonData}
                        onGenerate={handleGenerate}
                    />
                </div>

                {/* Right: The Preview */}
                <div className="hidden md:block w-[60%] h-full relative">
                    <LivePreview data={sermonData} />
                </div>
            </div>
        </ShellLayout>
    );
}