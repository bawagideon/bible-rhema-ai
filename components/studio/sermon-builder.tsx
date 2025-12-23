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
import { Button } from "@/components/ui/button";
import { Sparkles, Bold, Italic, List, Heading1, Heading2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export interface SermonData {
    title: string;
    scripture: string;
    tone: string;
    notes: string;
}

interface SermonBuilderProps {
    data: SermonData;
    onChange: (data: SermonData) => void;
    onGenerate?: () => void;
    onSave?: () => void;
    isSaving?: boolean;
}

export function SermonBuilder({ data, onChange, onGenerate, onSave, isSaving }: SermonBuilderProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start typing your sermon points here...',
            }),
        ],
        content: data.notes,
        immediatelyRender: false, // Fix hydration mismatch
        editorProps: {
            attributes: {
                class: 'flex-1 min-h-[400px] bg-muted/50 border border-border rounded-md p-6 leading-relaxed font-serif text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]/30 selection:bg-[#D4AF37]/20 prose prose-sm max-w-none dark:prose-invert',
            },
        },
        onUpdate: ({ editor }) => {
            onChange({ ...data, notes: editor.getHTML() });
        },
    });

    // Sync external changes (e.g. Clear or Generate)
    useEffect(() => {
        if (editor && data.notes !== editor.getHTML()) {
            // Only update if difference is significant to avoid cursor jumps
            if (data.notes === "" || (!editor.isFocused && data.notes.length > 0)) {
                editor.commands.setContent(data.notes);
            }
        }
    }, [data.notes, editor]);

    const handleChange = (field: keyof SermonData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const handleClear = () => {
        toast("Are you sure you want to clear?", {
            description: "This action cannot be undone.",
            action: {
                label: "Clear Sermon",
                onClick: () => {
                    onChange({
                        title: "",
                        scripture: "",
                        tone: "Theological",
                        notes: ""
                    });
                    editor?.commands.clearContent();
                    toast.success("Sermon cleared.");
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        });
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6 bg-card border-r border-border overflow-y-auto w-full max-w-full">
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-medium tracking-wide">New Sermon</h2>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleClear}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Clear Sermon"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="h-6 w-px bg-border/50 mx-1" />
                    <Button
                        onClick={onSave}
                        variant="outline"
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                        onClick={onGenerate}
                        className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold gap-2"
                    >
                        <Sparkles className="h-4 w-4" />
                        Generate
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Topic / Title</Label>
                    <Input
                        id="title"
                        placeholder="e.g. The Power of the Blood"
                        value={data.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="bg-muted border-border focus-visible:ring-[#D4AF37]/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="scripture">Key Scripture</Label>
                        <Input
                            id="scripture"
                            placeholder="e.g. Hebrews 9:12"
                            value={data.scripture}
                            onChange={(e) => handleChange("scripture", e.target.value)}
                            className="bg-muted border-border focus-visible:ring-[#D4AF37]/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tone">Tone</Label>
                        <Select
                            value={data.tone}
                            onValueChange={(value) => handleChange("tone", value)}
                        >
                            <SelectTrigger className="bg-muted border-border focus:ring-[#D4AF37]/50">
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

                <div className="space-y-2 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="notes">Notes / Outline</Label>
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-md border border-border/50">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", editor?.isActive('bold') && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                title="Bold (Ctrl+B)"
                            >
                                <Bold className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", editor?.isActive('italic') && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                title="Italic (Ctrl+I)"
                            >
                                <Italic className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", editor?.isActive('bulletList') && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                title="List"
                            >
                                <List className="h-3 w-3" />
                            </Button>
                            <div className="w-px h-3 bg-border" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", editor?.isActive('heading', { level: 1 }) && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                title="Heading 1"
                            >
                                <Heading1 className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", editor?.isActive('heading', { level: 2 }) && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                title="Heading 2"
                            >
                                <Heading2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
                </div>
            </div>
        </div>
    );
}
