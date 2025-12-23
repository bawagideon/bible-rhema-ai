"use client";

import { useState, useEffect } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { SermonBuilder, type SermonData } from "@/components/studio/sermon-builder";
import { LivePreview } from "@/components/studio/pdf-preview";
import { saveSermon } from "@/lib/api";
import { Toaster, toast } from "sonner";
import { useRhema } from "@/lib/store/rhema-context";

// No more dynamic import needed for the container itself
// The html2pdf library is dynamically imported inside the component on click.

export default function StudioPage() {
    const { sermonToLoad, setSermonToLoad, triggerSaveComplete } = useRhema();
    const [isSaving, setIsSaving] = useState(false);
    const [sermonData, setSermonData] = useState<SermonData>({
        title: "",
        scripture: "",
        tone: "Theological",
        notes: "",
    });

    // Effect to handle loading from context (Right Panel Library)
    useEffect(() => {
        if (sermonToLoad) {
            setSermonData(sermonToLoad);
            toast.success(`Loaded "${sermonToLoad.title || 'Sermon'}"`);
            setSermonToLoad(null);
        }
    }, [sermonToLoad, setSermonToLoad]);

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

        setSermonData((prev: SermonData) => ({ ...prev, notes: aiContent }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveSermon(sermonData);
        setIsSaving(false);

        if (result.success) {
            toast.success("Sermon saved to library!");
            triggerSaveComplete(); // Refresh the sidebar
        } else {
            toast.error("Failed to save sermon.");
        }
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
                        onSave={handleSave}
                        isSaving={isSaving}
                    />
                </div>

                {/* Right: The Preview */}
                <div className="hidden md:block w-[60%] h-full relative">
                    <LivePreview data={sermonData} />
                </div>
            </div>
            <Toaster position="bottom-right" theme="dark" />
        </ShellLayout>
    );
}
