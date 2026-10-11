"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ContextManager, ContextItem } from "./context-manager";
import { TipTapEditor } from "./editor/tiptap-editor";
import { toast } from "sonner";

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
    isGenerating?: boolean;
    isViewOnly?: boolean;
}

export function SermonBuilder({ data, onChange, onGenerate, isSaving, isGenerating = false }: SermonBuilderProps) {
    const [isAiAssisting, setIsAiAssisting] = useState(false);

    // Helper to update fields
    const handleChange = (field: keyof SermonData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    // AI Action Handler (passed to TipTap)
    const handleAiAction = async (action: string, editor: any) => {
        setIsAiAssisting(true);
        toast.info(`Applying AI Assist: ${action}...`);
        try {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            const contextText = selectedText || editor.getText().slice(-300) || data.title || "The Word of God";

            const res = await fetch('/api/studio/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, text: contextText })
            });

            const resData = await res.json();
            if (resData.success && resData.content) {
                editor.commands.insertContent(" " + resData.content);
                toast.success(`AI Assist: ${action} applied!`);
            } else {
                toast.error("AI Assist was unable to complete.");
            }
        } catch (e) {
            console.error("AI Assist failed:", e);
            toast.error("Failed to connect to AI Assist.");
        } finally {
            setIsAiAssisting(false);
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
                                placeholder="e.g. The Weight of Glory"
                                value={data.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Key Scripture</Label>
                            <Input
                                placeholder="e.g. 2 Corinthians 4:17"
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
                                    <SelectItem value="Expository">Expository</SelectItem>
                                    <SelectItem value="Pastoral">Pastoral</SelectItem>
                                    <SelectItem value="Prophetic">Prophetic</SelectItem>
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
                    isAiLoading={isAiAssisting || isGenerating}
                />
            </div>
        </div>
    );
}
