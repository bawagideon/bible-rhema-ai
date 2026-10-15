"use client";

import { useState, useEffect } from "react";
import { ShellLayout } from "@/components/layout/shell-layout";
import { type SermonData } from "@/components/studio/sermon-builder";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { SampleOutlineModal } from "@/components/studio/sample-outline-modal";
import { NewSermonDialog } from "@/components/studio/new-sermon-dialog";
import { PreachModeModal } from "@/components/studio/preach-mode-modal";
import { saveSermon, fetchSermons, SavedSermon } from "@/lib/api";
import { Toaster, toast } from "sonner";
import { useRhema } from "@/lib/store/rhema-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Sparkles, ShieldCheck, Lock, ArrowRight, Zap, Check, FileText,
    Clock, Calendar, Play, Plus, Trash2, Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudioPage() {
    const { userTier, userRole, sermonToLoad, setSermonToLoad, triggerSaveComplete } = useRhema();
    const router = useRouter();

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [view, setView] = useState<'home' | 'editor'>('editor'); // default to editor if loaded
    const [savedSermons, setSavedSermons] = useState<SavedSermon[]>([]);
    const [showSampleModal, setShowSampleModal] = useState(false);
    const [showNewSermonModal, setShowNewSermonModal] = useState(false);
    const [preachModeSermon, setPreachModeSermon] = useState<SavedSermon | null>(null);

    const [sermonData, setSermonData] = useState<SermonData>({
        title: "The Vine and the Branches",
        scripture: "John 15:1-8",
        tone: "Expository",
        notes: "<h2>The Vine and the Branches</h2><p class=\"scripture-callout\"><em>\"I am the true vine, and my Father is the husbandman. Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit.\" — John 15:1-2</em></p><h3>Point I: The Vinedresser's Intentionality</h3><p>Spiritual vitality is not self-generated. The Father prunes so secondary distractions are removed and primary fruit may flourish.</p><h3>Point II: Abiding as Continual Communion</h3><p>A severed branch does not struggle; it simply withers. True fruit is the involuntary consequence of remaining in Christ.</p><h3>Point III: Much Fruit to the Glory of God</h3><p>The ultimate aim of abiding is doxological—that the world may see Christ's indwelling power.</p><h3>Altar Call</h3><p>Invite believers to lay down religious exhaustion and return to secret-place abiding.</p>",
        context: [],
    });

    const isMinister = userTier === 'MINISTER' || userRole === 'MINISTER';

    // Calculate days until next Sunday
    const getSundayCountdown = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday
        const days = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const target = new Date(today);
        target.setDate(today.getDate() + days);
        const formatted = target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return { days, formatted };
    };

    const sundayInfo = getSundayCountdown();

    // Load sermons
    useEffect(() => {
        if (isMinister) {
            loadSermons();
        }
    }, [isMinister]);

    const loadSermons = async () => {
        try {
            const res = await fetchSermons();
            if (res.success && res.data) {
                setSavedSermons(res.data);
            }
        } catch (e) {
            console.error("Failed to load sermons", e);
        }
    };

    // Effect to handle loading from context (e.g. from Library or SpiritOS)
    useEffect(() => {
        if (sermonToLoad) {
            setSermonData({
                ...sermonToLoad,
                context: sermonToLoad.context || []
            });
            setView('editor');
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
            loadSermons();
        } else {
            toast.error(result.error?.message || "Failed to save sermon.");
        }
    };

    const handleCreateNewSermon = (newSermon: SermonData) => {
        setSermonData(newSermon);
        setView('editor');
        toast.success(`Started new manuscript: "${newSermon.title}"`);
    };

    const handleDeleteSermon = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/sermons?id=${id}`, { method: 'DELETE' });
            setSavedSermons(prev => prev.filter(s => s.id !== id));
            toast.success("Sermon deleted");
        } catch (e) {
            toast.error("Failed to delete sermon");
        }
    };

    // SCREEN 13: LOCKED PREVIEW FOR SEEKERS / DISCIPLES
    if (!isMinister) {
        return (
            <ShellLayout>
                <div className="flex-1 flex items-center justify-center p-4 md:p-8 font-sans">
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

                        {/* Interactive Sample Outline Trigger (Screen 13) */}
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowSampleModal(true)}
                                className="w-full border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs py-5 gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                See a sample sermon outline
                            </Button>
                        </div>

                        {/* Minister Plan Value Props */}
                        <div className="text-left space-y-2.5 bg-[#181818] p-5 rounded-xl border border-gray-800 text-xs text-gray-300">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span><strong>Verified Scripture:</strong> Quoted verses fetched directly from the text</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span><strong>Faithfulness check:</strong> Confirms each reference in the manuscript exists</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span><strong>Preach mode:</strong> Teleprompter with auto-scroll & timer for iPad/phone</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span><strong>Sunday countdown:</strong> Preparation timeline & speaking time calculator</span>
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

                <SampleOutlineModal
                    open={showSampleModal}
                    onOpenChange={setShowSampleModal}
                />
            </ShellLayout>
        );
    }

    // SCREEN 12: MINISTER HOME VIEW (SUNDAY COUNTDOWN + ACTIVE DRAFT + RECENT LIST)
    if (view === 'home') {
        return (
            <ShellLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto pb-28 font-sans">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Sermon Studio</h1>
                                <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-0 text-xs font-mono">
                                    MINISTER PRO
                                </Badge>
                            </div>
                            <p className="text-gray-400 text-xs md:text-sm mt-1">
                                Expository preparation, verified scripture manuscripts, and pulpit teleprompter.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setShowNewSermonModal(true)}
                                className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs py-5 px-4 shadow-lg shadow-[#D4AF37]/20"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                New Sermon
                            </Button>
                        </div>
                    </div>

                    {/* SUNDAY COUNTDOWN HERO BANNER (Screen 12) */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171717] via-[#141416] to-[#1a1813] border border-[#D4AF37]/35 p-6 md:p-7 shadow-xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-0 text-[10px] font-mono uppercase tracking-widest">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {sundayInfo.days === 0 ? "Sunday is today!" : sundayInfo.days === 1 ? "Sunday is tomorrow!" : `Sunday is in ${sundayInfo.days} days`}
                                    </Badge>
                                    <span className="text-gray-600">·</span>
                                    <span className="text-xs text-gray-400 font-serif italic">{sundayInfo.formatted}</span>
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                                    {sermonData.title || "The Vine and the Branches"}
                                </h2>
                                <p className="text-xs text-gray-300 font-serif italic">
                                    {sermonData.scripture || "John 15:1-8"} · Expository Series
                                </p>

                                {/* Active Draft Preparation Checklist */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                        <Check className="w-3.5 h-3.5" /> Scripture chosen
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                        <Check className="w-3.5 h-3.5" /> Outline drafted
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex items-center justify-center text-[9px]">3</div>
                                        <span>Points written</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex items-center justify-center text-[9px]">4</div>
                                        <span>Pulpit ready</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                <Button
                                    onClick={() => setView('editor')}
                                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs py-5 px-5"
                                >
                                    Resume Writing
                                    <ArrowRight className="w-4 h-4 ml-1.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* RECENT SERMONS GRID */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-lg font-bold text-white">Your Pulpit Manuscripts</h3>
                            <span className="text-xs text-gray-500 font-mono">{savedSermons.length} sermons archived</span>
                        </div>

                        {savedSermons.length === 0 ? (
                            <div className="text-center py-16 p-8 border border-gray-800 rounded-2xl bg-[#121212] space-y-3">
                                <FileText className="w-10 h-10 text-gray-600 mx-auto" />
                                <h4 className="font-serif text-base font-semibold text-white">No Previous Sermons Saved</h4>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    Prepare your next sermon outline or draft your manuscript in the Studio workspace.
                                </p>
                                <Button
                                    onClick={() => setView('editor')}
                                    className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs font-semibold"
                                >
                                    Open Current Workspace
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedSermons.map((sermon) => (
                                    <div
                                        key={sermon.id}
                                        onClick={() => {
                                            setSermonData(sermon.content_json);
                                            setView('editor');
                                        }}
                                        className="p-5 rounded-xl border border-gray-800 bg-[#141416] hover:border-gray-700 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-0 text-[10px]">
                                                    {sermon.content_json?.tone || "Expository"}
                                                </Badge>
                                                <span>{new Date(sermon.created_at).toLocaleDateString()}</span>
                                            </div>

                                            <h4 className="text-base font-semibold text-white mt-2">{sermon.title}</h4>
                                            {sermon.content_json?.scripture && (
                                                <p className="text-xs text-[#D4AF37] font-serif italic mt-0.5">{sermon.content_json.scripture}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                                            <button
                                                onClick={(e) => handleDeleteSermon(sermon.id, e)}
                                                className="text-gray-500 hover:text-rose-400 transition-colors p-1"
                                                title="Delete sermon"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreachModeSermon(sermon);
                                                    }}
                                                    className="text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 gap-1 font-semibold"
                                                >
                                                    <Play className="w-3 h-3 fill-[#D4AF37]" />
                                                    Preach
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSermonData(sermon.content_json);
                                                        setView('editor');
                                                    }}
                                                    className="text-xs bg-[#D4AF37] text-black hover:bg-[#b5952f] h-8 font-semibold"
                                                >
                                                    Edit Manuscript
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <NewSermonDialog
                    open={showNewSermonModal}
                    onOpenChange={setShowNewSermonModal}
                    onCreateSermon={handleCreateNewSermon}
                />

                {preachModeSermon && (
                    <PreachModeModal
                        open={!!preachModeSermon}
                        onClose={() => setPreachModeSermon(null)}
                        title={preachModeSermon.title}
                        scripture={preachModeSermon.content_json?.scripture || ""}
                        contentHtml={preachModeSermon.content_json?.notes || ""}
                    />
                )}
            </ShellLayout>
        );
    }

    // SCREENS 11 & 14: STUDIO WORKSPACE VIEW
    return (
        <ShellLayout>
            <StudioWorkspace
                data={sermonData}
                onChange={setSermonData}
                onSave={handleSave}
                onGenerate={handleGenerate}
                onBackToHome={() => setView('home')}
                isSaving={isSaving}
                isGenerating={isGenerating}
            />
            <Toaster position="bottom-right" theme="dark" />
        </ShellLayout>
    );
}
