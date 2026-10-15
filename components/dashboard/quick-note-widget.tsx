"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Feather, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function QuickNoteWidget() {
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState(false);

    const handleSaveNote = async () => {
        if (!note.trim()) {
            toast.error("Please enter a note to save");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Quick Note · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
                    content: note.trim(),
                    scripture_ref: "Personal Walk"
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setNote("");
                setSavedMessage(true);
                toast.success("Saved to your Library");
                setTimeout(() => setSavedMessage(false), 4000);
            } else {
                toast.error(data.error || "Failed to save note");
            }
        } catch (e: any) {
            console.error("Quick note error:", e);
            toast.error("Network error while saving note");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border border-border/60 bg-[#121214] rounded-2xl relative overflow-hidden flex flex-col justify-between h-full">
            <CardContent className="p-5 md:p-6 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Feather className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="font-serif font-bold text-xs uppercase tracking-widest text-muted-foreground">
                            Quick Note
                        </h3>
                    </div>
                    {savedMessage && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in duration-300">
                            <Check className="w-3.5 h-3.5" /> Saved to your Library
                        </span>
                    )}
                </div>

                <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Capture what God spoke today or an altar insight..."
                    className="bg-black/40 border-gray-800 text-sm focus-visible:ring-[#D4AF37]/50 rounded-xl resize-none flex-1 min-h-[110px] text-gray-200 placeholder:text-gray-500"
                />

                <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                        Synched directly into your personal spiritual library.
                    </span>
                    <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={isSaving || !note.trim()}
                        className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-xs h-8 px-4"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...
                            </>
                        ) : (
                            "Save note"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
