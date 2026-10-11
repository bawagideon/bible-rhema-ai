"use client";

import { useState, useEffect } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { type SermonData } from "@/components/studio/sermon-builder";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { saveSermon } from "@/lib/api";
import { Toaster, toast } from "sonner";
import { useRhema } from "@/lib/store/rhema-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Lock, ArrowRight, Zap, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudioPage() {
    const { userTier, userRole, sermonToLoad, setSermonToLoad, triggerSaveComplete } = useRhema();
    const router = useRouter();

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sermonData, setSermonData] = useState<SermonData>({
        title: "",
        scripture: "",
        tone: "Theological",
        notes: "",
        context: [],
    });

    const isMinister = userTier === 'MINISTER' || userRole === 'MINISTER';

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
        if (!isMinister) {
            toast.error("Sermon Studio AI Architect requires the Minister plan.");
            return;
        }

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
            triggerSaveComplete();
        } else {
            toast.error(result.error?.message || "Failed to save sermon.");
        }
    };

    if (!isMinister) {
        return (
            <ShellLayout>
                <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                    <div className="max-w-xl w-full p-8 md:p-10 rounded-2xl bg-[#121212] border border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/5 text-center space-y-6">
                        <div className="inline-flex p-4 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                            <Lock className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                            <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] uppercase tracking-wider text-xs">
                                Minister Plan Exclusive
                            </Badge>
                            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
                                Unlock Sermon Studio
                            </h2>
                            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                                The full expository preaching and homiletics workspace designed specifically for pastors, teachers, and ministry leaders.
                            </p>
                        </div>

                        <div className="text-left space-y-2.5 bg-[#181818] p-5 rounded-xl border border-gray-800 text-xs text-gray-300">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>AI Homiletics Outline & Manuscript Generator</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>Context Vault & Biblical Research Engine</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>High-Resolution PDF Manuscript Export for the Pulpit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>Unlimited Sermon Drafts & Cloud Archival</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => router.push('/pricing')}
                                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold py-6 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                            >
                                <Zap className="w-4 h-4" />
                                Upgrade to Minister (₦15,000 / month)
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </ShellLayout>
        );
    }

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
