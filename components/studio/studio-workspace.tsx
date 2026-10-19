"use client";

import { useState } from "react";
import { SermonBuilder, SermonData } from "./sermon-builder";
import { LivePreview } from "./pdf-preview";
import { Button } from "@/components/ui/button";
import {
    PenTool, Eye, Save, Sparkles, Volume2, ShieldCheck,
    Lightbulb, Play, Clock, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FormatSettings, FormatSettingsState } from "./format-settings";
import { UpgradeLock } from "./upgrade-lock";
import { UpgradeDialog } from "./upgrade-dialog";
import { useRhema } from "@/lib/store/rhema-context";
import { PreachModeModal } from "./preach-mode-modal";
import { FaithfulnessCheckModal } from "./faithfulness-check-modal";
import { IllustrationDialog } from "./illustration-dialog";
import { Badge } from "@/components/ui/badge";

interface StudioWorkspaceProps {
    data: SermonData;
    onChange: (data: SermonData) => void;
    onSave: () => void;
    onGenerate: () => void;
    onBackToHome?: () => void;
    isSaving: boolean;
    isGenerating?: boolean;
}

type ViewMode = 'write' | 'preview';

export function StudioWorkspace({
    data,
    onChange,
    onSave,
    onGenerate,
    onBackToHome,
    isSaving,
    isGenerating = false
}: StudioWorkspaceProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('write');
    const [formatSettings, setFormatSettings] = useState<FormatSettingsState>({
        typography: 'serif',
        lineHeight: 'comfortable',
        theme: 'modern'
    });

    // Modals
    const [showPreachMode, setShowPreachMode] = useState(false);
    const [showFaithfulnessModal, setShowFaithfulnessModal] = useState(false);
    const [faithfulnessStats, setFaithfulnessStats] = useState<{ verified: number; total: number } | null>(null);
    const [showIllustrationModal, setShowIllustrationModal] = useState(false);

    // Auth & Gate
    const { userTier } = useRhema();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    // Live Word Count & Speaking Time (at 130 wpm)
    const rawText = data.notes?.replace(/<[^>]*>?/gm, '') || '';
    const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
    const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));

    const handleGenerateClick = () => {
        if (userTier !== 'MINISTER') {
            setShowUpgradeDialog(true);
            return;
        }
        onGenerate();
    };

    const handleInsertIllustration = (illustrationHtml: string) => {
        onChange({
            ...data,
            notes: (data.notes || "") + "<br/>" + illustrationHtml
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
            <UpgradeDialog
                isOpen={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
                featureName="AI Sermon Architect"
            />

            {/* Preach Mode Teleprompter Modal */}
            <PreachModeModal
                open={showPreachMode}
                onClose={() => setShowPreachMode(false)}
                title={data.title}
                scripture={data.scripture}
                contentHtml={data.notes}
            />

            {/* Faithfulness Check Modal */}
            <FaithfulnessCheckModal
                open={showFaithfulnessModal}
                onOpenChange={setShowFaithfulnessModal}
                scripture={data.scripture}
                notesHtml={data.notes}
                onVerificationUpdate={(verified, total) => setFaithfulnessStats({ verified, total })}
            />

            {/* Illustration Assistant Dialog */}
            <IllustrationDialog
                open={showIllustrationModal}
                onOpenChange={setShowIllustrationModal}
                topic={data.title}
                scripture={data.scripture}
                onInsertIllustration={handleInsertIllustration}
            />

            {/* TOP BAR / CONTROL HUD */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 bg-[#121214] shrink-0 shadow-md z-30">
                {/* Left: Home navigation, Title & Word count / Speaking time */}
                <div className="flex items-center gap-3 md:gap-5">
                    {onBackToHome && (
                        <button
                            onClick={onBackToHome}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            title="Back to Sermons Home"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-serif text-sm md:text-base font-bold tracking-tight text-white line-clamp-1">
                                {data.title || "Untitled Sermon"}
                            </h2>
                            <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-0 text-[10px] font-mono">
                                MINISTER
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#D4AF37]" />
                                {wordCount.toLocaleString()} words · ~{estimatedMinutes} mins at 130 wpm
                            </span>
                        </div>
                    </div>

                    {/* Dynamic Scripture Citation Badge */}
                    <button
                        onClick={() => setShowFaithfulnessModal(true)}
                        className={cn(
                            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-colors border",
                            !faithfulnessStats || faithfulnessStats.total === 0
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                : faithfulnessStats.verified === faithfulnessStats.total
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                        )}
                        title="Open Scripture Citation & Reference Check"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                            {!faithfulnessStats
                                ? "Citation check"
                                : faithfulnessStats.total === 0
                                    ? "0 citations"
                                    : `${faithfulnessStats.verified}/${faithfulnessStats.total} citations resolved`}
                        </span>
                    </button>
                </div>

                {/* Right: Actions, Preach Mode, Views, and Save */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Illustration Generator Button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowIllustrationModal(true)}
                        className="hidden md:flex text-xs text-gray-300 hover:text-white hover:bg-gray-800 gap-1.5"
                    >
                        <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Illustration Ideas
                    </Button>

                    {/* Preach Mode Pulpit Button (Screen 15) */}
                    <Button
                        size="sm"
                        onClick={() => setShowPreachMode(true)}
                        className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs gap-1.5 shadow-md shadow-[#D4AF37]/15"
                    >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        Preach Mode
                    </Button>

                    {/* View Toggle (Write vs PDF Preview) */}
                    <div className="hidden lg:flex bg-[#1a1a1c] p-0.5 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setViewMode('write')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                                viewMode === 'write'
                                    ? "bg-[#D4AF37] text-black font-semibold shadow-sm"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <PenTool className="h-3 w-3" />
                            Write
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                                viewMode === 'preview'
                                    ? "bg-[#D4AF37] text-black font-semibold shadow-sm"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Eye className="h-3 w-3" />
                            Preview PDF
                        </button>
                    </div>

                    <FormatSettings
                        settings={formatSettings}
                        onUpdate={setFormatSettings}
                    />

                    <div className="h-5 w-px bg-gray-800 mx-1 hidden sm:block" />

                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-white hover:bg-gray-800 text-xs gap-1.5"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>

                    {/* AI Architect Generate Button */}
                    <Button
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        size="sm"
                        className="bg-black hover:bg-gray-900 border border-[#D4AF37]/50 text-white gap-1.5 text-xs shadow-sm"
                    >
                        <Sparkles className={cn("h-3.5 w-3.5 text-[#D4AF37]", isGenerating && "animate-spin")} />
                        {isGenerating ? "Crafting..." : "AI Generate"}
                    </Button>
                </div>
            </div>

            {/* MAIN WORKSPACE AREA */}
            <div className="flex-1 overflow-hidden relative bg-[#09090b]">
                <AnimatePresence mode="wait">
                    {viewMode === 'write' ? (
                        <motion.div
                            key="write"
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            transition={{ duration: 0.15 }}
                            className="h-full w-full"
                        >
                            <SermonBuilder
                                data={data}
                                onChange={onChange}
                                onGenerate={onGenerate}
                                onSave={onSave}
                                isSaving={isSaving}
                                isGenerating={isGenerating}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            transition={{ duration: 0.15 }}
                            className="h-full w-full bg-[#121214] flex justify-center p-6 md:p-8 overflow-y-auto"
                        >
                            <div className="scale-90 md:scale-95 origin-top relative w-full max-w-4xl">
                                <UpgradeLock minTier="MINISTER" blurAmount="md">
                                    <LivePreview data={data} />
                                </UpgradeLock>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
