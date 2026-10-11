"use client";

import { useState, useEffect } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { type SermonData } from "@/components/studio/sermon-builder";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { saveSermon } from "@/lib/api";
import { Toaster, toast } from "sonner";
import { useRhema } from "@/lib/store/rhema-context";

export default function StudioPage() {
    const { sermonToLoad, setSermonToLoad, triggerSaveComplete } = useRhema();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sermonData, setSermonData] = useState<SermonData>({
        title: "",
        scripture: "",
        tone: "Theological",
        notes: "",
        context: [],
    });

    // Effect to handle loading from context (Right Panel Library)
    useEffect(() => {
        if (sermonToLoad) {
            setSermonData({
                ...sermonToLoad,
                context: sermonToLoad.context || []
            });
            toast.success(`Loaded "${sermonToLoad.title || 'Sermon'}"`);
            setSermonToLoad(null);
        }
    }, [sermonToLoad, setSermonToLoad]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        toast.info("RhemaAI Sermon Architect is crafting your sermon outline...");

        try {
            const res = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: sermonData.title,
                    scripture: sermonData.scripture,
                    tone: sermonData.tone,
                    context: sermonData.context,
                    notes: sermonData.notes
                })
            });

            const data = await res.json();

            if (data.success && data.content) {
                setSermonData((prev: SermonData) => ({
                    ...prev,
                    notes: prev.notes ? prev.notes + "<br/>" + data.content : data.content
                }));
                toast.success("Sermon outline generated successfully!");
            } else {
                toast.error(data.error || "Failed to generate sermon outline.");
            }
        } catch (error) {
            console.error("Error generating sermon:", error);
            toast.error("Failed to connect to sermon generator.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveSermon(sermonData);
        setIsSaving(false);

        if (result.success) {
            toast.success("Sermon saved to your library!");
            triggerSaveComplete(); // Refresh the sidebar
        } else {
            toast.error(result.error?.message || "Failed to save sermon.");
        }
    };

    return (
        <ShellLayout>
            <StudioWorkspace
                data={sermonData}
                onChange={setSermonData}
                onSave={handleSave}
                onGenerate={handleGenerate}
                isSaving={isSaving}
                isGenerating={isGenerating}
            />
            <Toaster position="bottom-right" theme="dark" />
        </ShellLayout>
    );
}
