"use client";

import { useState } from "react";
import { SermonBuilder, SermonData } from "./sermon-builder";
import { LivePreview } from "./pdf-preview";
import { Button } from "@/components/ui/button";
import { PenTool, Eye, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FormatSettings, FormatSettingsState } from "./format-settings";
import { UpgradeLock } from "./upgrade-lock";
import { UpgradeDialog } from "./upgrade-dialog";
import { useRhema } from "@/lib/store/rhema-context";

interface StudioWorkspaceProps {
    data: SermonData;
    onChange: (data: SermonData) => void;
    onSave: () => void;
    onGenerate: () => void;
    isSaving: boolean;
}

type ViewMode = 'write' | 'preview';

export function StudioWorkspace({ data, onChange, onSave, onGenerate, isSaving }: StudioWorkspaceProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('write');
    const [formatSettings, setFormatSettings] = useState<FormatSettingsState>({
        typography: 'serif',
        lineHeight: 'comfortable',
        theme: 'modern'
    });

    // Auth & Gate
    const { userTier } = useRhema();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const handleGenerateClick = () => {
        if (userTier !== 'MINISTER') {
            setShowUpgradeDialog(true);
            return;
        }
        onGenerate();
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfcfc] overflow-hidden">
            <UpgradeDialog
                isOpen={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
                featureName="AI Generation"
            />
            {/* Header / Control Bar */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 shadow-sm z-30">
                <div className="flex items-center gap-6">
                    <h2 className="font-serif text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        Studio <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full font-sans font-medium">PRO</span>
                    </h2>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('write')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                viewMode === 'write'
                                    ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <PenTool className="h-3.5 w-3.5" />
                            Write
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                viewMode === 'preview'
                                    ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <FormatSettings
                        settings={formatSettings}
                        onUpdate={setFormatSettings}
                    />

                    <div className="h-6 w-px bg-gray-200 mx-1" />

                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save</>}
                    </Button>

                    <div className="relative group">
                        <Button
                            onClick={handleGenerateClick}
                            size="sm"
                            className="bg-black text-white hover:bg-gray-800 gap-2 shadow-sm transition-transform active:scale-95 relative overflow-hidden"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate AI
                            {userTier !== 'MINISTER' && (
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="bg-[#D4AF37] p-1 rounded-full"><div className="h-2 w-2 bg-black rounded-full" /></div>
                                </div>
                            )}
                        </Button>
                        {userTier !== 'MINISTER' && (
                            <div className="absolute top-full mt-2 right-0 w-max bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                Premium Feature
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Workspace Area */}
            <div className="flex-1 overflow-hidden relative bg-[#09090b]">
                <AnimatePresence mode="wait">
                    {viewMode === 'write' ? (
                        <motion.div
                            key="write"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeInOut" }}
                            className="h-full w-full"
                        >
                            <SermonBuilder
                                data={data}
                                onChange={onChange}
                                onGenerate={onGenerate}
                                onSave={onSave} // Passed down but unused in UI directly
                                isSaving={isSaving}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeInOut" }}
                            className="h-full w-full bg-[#1c1c1c] flex justify-center p-8 overflow-y-auto"
                        >
                            <div className="scale-90 origin-top relative">
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
