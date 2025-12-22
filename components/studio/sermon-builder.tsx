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
import { Sparkles } from "lucide-react";

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
}

export function SermonBuilder({ data, onChange, onGenerate }: SermonBuilderProps) {
    const handleChange = (field: keyof SermonData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-8 bg-card border-r border-border overflow-y-auto">
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-medium tracking-wide">New Sermon</h2>
                <Button
                    onClick={onGenerate}
                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold gap-2"
                >
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                </Button>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Topic / Title</Label>
                    <Input
                        id="title"
                        placeholder="e.g. The Power of the Blood"
                        value={data.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="bg-muted border-border"
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
                            className="bg-muted border-border"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tone">Tone</Label>
                        <Select
                            value={data.tone}
                            onValueChange={(value) => handleChange("tone", value)}
                        >
                            <SelectTrigger className="bg-muted border-border">
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
                    <Label htmlFor="notes">Notes / Outline</Label>
                    <Textarea
                        id="notes"
                        placeholder="Start typing your sermon points here..."
                        value={data.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        className="flex-1 min-h-[400px] bg-muted border-border resize-none p-4 leading-relaxed"
                    />
                </div>
            </div>
        </div>
    );
}
