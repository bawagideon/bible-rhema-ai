"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ShellLayout } from "@/components/layout/shell-layout";
import { SermonBuilder, type SermonData } from "@/components/studio/sermon-builder";

// QUARANTINE FIX:
// 1. We import from the NEW filename 'pdf-preview' to break the cache.
// 2. We use 'ssr: false' to ensure the server never touches the PDF engine.
const PdfPreview = dynamic(
    () => import("@/components/studio/pdf-preview"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-[#1c1c1c]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mb-4"></div>
                <p className="font-serif">Loading Sanctuary Paper...</p>
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
                <div className="w-full md:w-[40%] h-full z-10 box-border border-r border-white/10">
                    <SermonBuilder
                        data={sermonData}
                        onChange={setSermonData}
                        onGenerate={handleGenerate}
                    />
                </div>

                {/* Right: The Preview */}
                <div className="hidden md:block w-[60%] h-full relative bg-[#1c1c1c]">
                    <PdfPreview data={sermonData} />
                </div>
            </div>
        </ShellLayout>
    );
}