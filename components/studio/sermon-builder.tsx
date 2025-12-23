"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useState } from "react";

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
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        list: false,
        h1: false,
        h2: false
    });

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
                    toast.success("Sermon cleared.");
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        });
    };

    const checkActiveFormatting = () => {
        const textarea = document.getElementById("notes") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const text = textarea.value;

        // Simple heuristic: check line start for Headers/List, check surrounding for Bold/Italic
        const currentLineStart = text.lastIndexOf('\n', start - 1) + 1;
        // Handle case where text ends with newline or is last line
        const nextNewline = text.indexOf('\n', currentLineStart);
        const currentLine = nextNewline === -1
            ? text.substring(currentLineStart)
            : text.substring(currentLineStart, nextNewline);

        const isList = currentLine.trim().startsWith('-');
        const isH1 = currentLine.trim().startsWith('# ');
        const isH2 = currentLine.trim().startsWith('## ');

        // Check for active bold/italic (very basic proximity check)
        const textBefore = text.substring(0, start);

        const boldCountBefore = (textBefore.match(/\*\*/g) || []).length;
        const isBold = boldCountBefore % 2 !== 0;

        // Logic for italic is complex because ** also contains *. 
        // For now, we'll keep it simple/safe and default to false to avoid confusing UX
        const isItalic = false;

        setActiveFormats({
            bold: isBold,
            italic: isItalic,
            list: isList,
            h1: isH1,
            h2: isH2
        });
    };

    const insertText = (before: string, after: string = "") => {
        const textarea = document.getElementById("notes") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        handleChange("notes", newText);

        // Defer cursor placement to ensure React rerender handles value update first
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
            checkActiveFormatting();
        }, 0);
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
                        Generate with AI
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
                                className={cn("h-6 w-6 transition-colors", activeFormats.bold && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => insertText("**", "**")}
                                title="Bold (Ctrl+B)"
                            >
                                <Bold className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", activeFormats.italic && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => insertText("*", "*")}
                                title="Italic (Ctrl+I)"
                            >
                                <Italic className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", activeFormats.list && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => insertText("\n- ")}
                                title="List"
                            >
                                <List className="h-3 w-3" />
                            </Button>
                            <div className="w-px h-3 bg-border" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", activeFormats.h1 && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => insertText("\n# ")}
                                title="Heading 1"
                            >
                                <Heading1 className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 transition-colors", activeFormats.h2 && "bg-[#D4AF37]/20 text-[#D4AF37]")}
                                onClick={() => insertText("\n## ")}
                                title="Heading 2"
                            >
                                <Heading2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        id="notes"
                        placeholder="Start typing your sermon points here..."
                        value={data.notes}
                        onChange={(e) => { handleChange("notes", e.target.value); checkActiveFormatting(); }}
                        onSelect={checkActiveFormatting}
                        className="flex-1 min-h-[400px] bg-muted/50 border-border resize-none p-6 leading-relaxed font-mono text-sm focus-visible:ring-[#D4AF37]/30 selection:bg-[#D4AF37]/20"
                    />
                </div>
            </div>
        </div>
    );
}
