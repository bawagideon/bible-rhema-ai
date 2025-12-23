"use client";

import { useState } from "react";
import { SermonBuilder, SermonData } from "./sermon-builder";
import { LivePreview } from "./pdf-preview";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, PenTool, Eye, Save, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    return (
        <div className="flex flex-col h-full bg-[#fcfcfc]">
            {/* Header / Control Bar */}
            <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="font-serif text-xl font-bold tracking-tight text-gray-900">Studio</h2>
                    <div className="h-6 w-px bg-gray-200" />

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('write')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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

                <div className="flex items-center gap-2">
                    <Select
                        value="A4"
                        onValueChange={() => { }}
                    >
                        <SelectTrigger className="w-[100px] h-8 text-xs bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A4">A4 Paper</SelectItem>
                            <SelectItem value="US">US Letter</SelectItem>
                        </SelectContent>
                    </Select>

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
                    <Button
                        onClick={onGenerate}
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 gap-2 shadow-sm"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate AI
                    </Button>
                </div>
            </div>

            {/* Main Workspace Area */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'write' ? (
                    <SermonBuilder
                        data={data}
                        onChange={onChange}
                        // Pass empty handlers as control bar now handles save/generate
                        onGenerate={() => { }}
                        onSave={() => { }}
                        isSaving={isSaving}
                        isViewOnly={false}
                    />
                ) : (
                    <LivePreview data={data} />
                )}
            </div>
        </div>
    );
}
