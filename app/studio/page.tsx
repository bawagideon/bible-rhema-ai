"use client";

import { useState } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { SermonBuilder, type SermonData } from "@/components/studio/sermon-builder";
import { LivePreview } from "@/components/studio/live-preview";

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
   - We cannot win this battle by suppression, only by walking in the Spirit.

III. The Resolution: Walking in Grace
   - Grace is not just pardon; it is power.
   - Practical steps to aligning with the Spirit daily:
     1. Word immersion
     2. Constant prayer
     3. Community accountability

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
