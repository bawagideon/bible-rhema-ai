"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Sparkles, Heart } from "lucide-react";

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTitle?: string;
    initialContent?: string;
    initialScripture?: string;
    onSaved?: () => void;
}

export function JournalModal({
    isOpen,
    onClose,
    initialTitle = "",
    initialContent = "",
    initialScripture = "",
    onSaved
}: JournalModalProps) {
    const [title, setTitle] = useState(initialTitle);
    const [scripture, setScripture] = useState(initialScripture);
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Please enter a reflection before saving.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim() || "Evening Reflection",
                    scripture_ref: scripture.trim() || undefined,
                    content: content.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Reflection preserved in your spiritual journal!");
                setTitle("");
                setContent("");
                setScripture("");
                if (onSaved) onSaved();
                onClose();
            } else {
                toast.error(data.error || "Could not save journal entry.");
            }
        } catch (err: any) {
            toast.error("Failed to connect to journal service: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#121212] border-gray-800 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-serif text-[#D4AF37]">
                        <BookOpen className="w-5 h-5" />
                        Reflect & Journal
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs">
                        Pour out your heart and record what the Holy Spirit is speaking to you today.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-medium">Title / Reflection Focus</label>
                        <Input
                            placeholder="e.g. Walking in Peace, God's Faithfulness"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-medium">Anchoring Scripture (Optional)</label>
                        <Input
                            placeholder="e.g. Psalm 4:8, Philippians 4:6-7"
                            value={scripture}
                            onChange={(e) => setScripture(e.target.value)}
                            className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-medium">Your Thoughts & Prayer</label>
                        <textarea
                            rows={6}
                            placeholder="Write your prayers, gratitude, or reflections here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full rounded-md p-3 text-sm bg-[#1a1a1a] border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold"
                        >
                            {isSaving ? "Preserving..." : "Save Reflection"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
