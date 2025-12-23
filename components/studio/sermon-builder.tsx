"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ContextManager, ContextItem } from "./context-manager";
import { TipTapEditor } from "./editor/tiptap-editor";

export interface SermonData {
    title: string;
    scripture: string;
    tone: string;
    notes: string;
    context: ContextItem[];
}

interface SermonBuilderProps {
    data: SermonData;
    onChange: (data: SermonData) => void;
    onGenerate: () => void;
    onSave: () => void;
    isSaving: boolean;
    isViewOnly?: boolean;
}

export function SermonBuilder({ data, onChange, onGenerate, isSaving }: SermonBuilderProps) {

    // Helper to update fields
    const handleChange = (field: keyof SermonData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    // AI Action Handler (passed to TipTap)
    const handleAiAction = (action: string, editor: any) => {
        if (action === 'expand') {
            editor.commands.insertContent(" (AI Expanding...) ");
            onGenerate();
        }
        else if (action === 'scripture') {
            editor.commands.insertContent("<blockquote>“Your word is a lamp to my feet...” (Psalm 119:105)</blockquote>");
        }
    };

    return (
        <div className="h-full flex overflow-hidden">
            {/* Left Sidebar: Settings & Context */}
            <div className="w-[300px] shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
                <div className="p-4 space-y-6">
                    {/* Metadata Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Topic / Title</Label>
                            <Input
                                placeholder="Sermon Title"
                                value={data.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Key Scripture</Label>
                            <Input
                                placeholder="e.g. John 3:16"
                                value={data.scripture}
                                onChange={(e) => handleChange("scripture", e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Tone</Label>
                            <Select
                                value={data.tone}
                                onValueChange={(value) => handleChange("tone", value)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Theological">Theological</SelectItem>
                                    <SelectItem value="Evangelistic">Evangelistic</SelectItem>
                                    <SelectItem value="Teaching">Teaching</SelectItem>
                                    <SelectItem value="Encouraging">Encouraging</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200" />

                    {/* Context Engine */}
                    <ContextManager
                        contextItems={data.context || []}
                        onAddContext={(item) => {
                            const newContext = [...(data.context || []), item];
                            handleChange("context", newContext);
                        }}
                        onRemoveContext={(id) => {
                            const newContext = (data.context || []).filter(i => i.id !== id);
                            handleChange("context", newContext);
                        }}
                    />
                </div>
            </div>

            {/* Center: The Divine Editor */}
            <div className="flex-1 overflow-hidden bg-[#f3f4f6]">
                <TipTapEditor
                    content={data.notes}
                    onChange={(html) => handleChange("notes", html)}
                    onAiAction={handleAiAction}
                    isAiLoading={isSaving} // Reuse saving state for now
                />
            </div>
        </div>
    );
}
