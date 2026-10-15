"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, ArrowRight } from "lucide-react";
import { SermonData } from "./sermon-builder";

interface NewSermonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateSermon: (newSermon: SermonData & { series?: string; duration?: string }) => void;
}

export function NewSermonDialog({ open, onOpenChange, onCreateSermon }: NewSermonDialogProps) {
    const [title, setTitle] = useState("");
    const [scripture, setScripture] = useState("");
    const [series, setSeries] = useState("");
    const [duration, setDuration] = useState("35");
    const [tone, setTone] = useState("Expository");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onCreateSermon({
            title: title.trim(),
            scripture: scripture.trim() || "John 15:1-8",
            series: series.trim() || "Sunday Expository Series",
            duration: duration,
            tone: tone,
            notes: `<h2>${title.trim()}</h2><p class="scripture-callout"><em>Scripture: ${scripture.trim() || "John 15:1-8"}</em></p><h3>Introduction</h3><p>Open with context and biblical historical setting...</p><h3>Point I: Foundation</h3><p>Exegesis of primary text...</p><h3>Point II: Spiritual Application</h3><p>How believers walk this out today...</p><h3>Point III: Exhortation</h3><p>Kingdom challenge to the congregation...</p><h3>Altar Call</h3><p>Closing appeal and prayer...</p>`,
            context: []
        });

        // Reset
        setTitle("");
        setScripture("");
        setSeries("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-[#141416] border-[#D4AF37]/40 text-white p-6 md:p-8 font-sans">
                <DialogHeader className="space-y-2 border-b border-gray-800 pb-4">
                    <DialogTitle className="font-serif text-2xl text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#D4AF37]" />
                        Prepare New Sermon
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs">
                        Configure the homiletical foundation for your upcoming Sunday manuscript or preaching outline.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-300">Sermon Title or Central Theme</Label>
                        <Input
                            placeholder="e.g. The Unshakable Kingdom, Walking in the Spirit"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-black/50 border-gray-800 text-white text-sm focus-visible:ring-[#D4AF37]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-300">Primary Scripture Reference</Label>
                            <Input
                                placeholder="e.g. Hebrews 12:25-29, Romans 8"
                                value={scripture}
                                onChange={(e) => setScripture(e.target.value)}
                                className="bg-black/50 border-gray-800 text-white text-sm focus-visible:ring-[#D4AF37]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-300">Series Name (Optional)</Label>
                            <Input
                                placeholder="e.g. Kingdom Fruitfulness"
                                value={series}
                                onChange={(e) => setSeries(e.target.value)}
                                className="bg-black/50 border-gray-800 text-white text-sm focus-visible:ring-[#D4AF37]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-300">Target Preaching Time</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className="bg-black/50 border-gray-800 text-xs text-gray-300">
                                    <SelectValue placeholder="Target duration" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141416] border-gray-800 text-xs text-gray-200">
                                    <SelectItem value="20">20 minutes (~2,600 words)</SelectItem>
                                    <SelectItem value="30">30 minutes (~3,900 words)</SelectItem>
                                    <SelectItem value="35">35 minutes (~4,550 words)</SelectItem>
                                    <SelectItem value="45">45 minutes (~5,850 words)</SelectItem>
                                    <SelectItem value="60">60 minutes (~7,800 words)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-300">Homiletical Tone</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger className="bg-black/50 border-gray-800 text-xs text-gray-300">
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141416] border-gray-800 text-xs text-gray-200">
                                    <SelectItem value="Expository">Expository</SelectItem>
                                    <SelectItem value="Theological">Theological</SelectItem>
                                    <SelectItem value="Pastoral">Pastoral</SelectItem>
                                    <SelectItem value="Evangelistic">Evangelistic</SelectItem>
                                    <SelectItem value="Prophetic">Prophetic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-800">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-xs text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!title.trim()}
                            className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs px-5 flex items-center gap-1.5"
                        >
                            Open Studio Workspace
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
