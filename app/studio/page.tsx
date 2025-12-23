"use client";

import { useState, useEffect } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { SermonBuilder, type SermonData } from "@/components/studio/sermon-builder";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
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
        context: [],
    });

    // Effect to handle loading from context (Right Panel Library)
    useEffect(() => {
        if (sermonToLoad) {
            setSermonData({
                ...sermonToLoad,
                context: sermonToLoad.context || [] // Ensure context exists
            });
            toast.success(`Loaded "${sermonToLoad.title || 'Sermon'}"`);
            setSermonToLoad(null);
        }
    }, [sermonToLoad, setSermonToLoad]);

    const handleGenerate = () => {
        // AI Generation Logic (Updated to use Context)
        const contextString = sermonData.context?.map(c => `[${c.label}]: ${c.content}`).join("\n") || "";

        const aiPrompt = `Topic: ${sermonData.title}\nScripture: ${sermonData.scripture}\nTone: ${sermonData.tone}\n\nContext Provided:\n${contextString}`;

        // Mock Response with HTML
        const aiContent = `<h2>I. Introduction: The Weight of Glory</h2>
<p>Defining glory not just as brightness, but as 'kabod' – heavy, weighty significance. The contrast between our light afflictions and the eternal weight of glory (2 Cor 4:17).</p>
<blockquote>“For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all.”</blockquote>
<h2>II. The Conflict: Flesh vs. Spirit</h2>
<ul>
<li>The flesh seeks immediate gratification; the spirit seeks eternal satisfaction.</li>
<li>Galatians 5:17 - the war within.</li>
<li>We cannot win this battle by suppression, only by walking in the Spirit.</li>
</ul>
<p>As written in your notes: <em>${contextString.substring(0, 50)}...</em> this confirms the struggle.</p>
<h2>Conclusion</h2>
<p>Let us not faint. The weight is building something in us that will last forever.</p>`;

        setSermonData((prev: SermonData) => ({ ...prev, notes: prev.notes + `<br/>` + aiContent }));
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
            <StudioWorkspace
                data={sermonData}
                onChange={setSermonData}
                onSave={handleSave}
                onGenerate={handleGenerate}
                isSaving={isSaving}
            />
            <Toaster position="bottom-right" theme="dark" />
        </ShellLayout>
    );
}
