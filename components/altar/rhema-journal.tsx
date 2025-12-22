"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RhemaJournal() {
    const [content, setContent] = useState("");
    const [aiEnabled, setAiEnabled] = useState(false);
    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    return (
        <div className="h-full flex flex-col bg-background relative selection:bg-primary/20">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-6 px-8 border-b border-border/30">
                <span className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
                    {dateStr}
                </span>
                <div className="flex items-center gap-3">
                    <Switch
                        id="ai-mode"
                        checked={aiEnabled}
                        onCheckedChange={setAiEnabled}
                        className="data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="ai-mode" className={cn("text-xs cursor-pointer select-none", aiEnabled ? "text-primary" : "text-muted-foreground")}>
                        Enable Rhema
                    </Label>
                </div>
            </div>

            {/* Writing Area */}
            <div className="flex-1 overflow-hidden relative group">
                <textarea
                    className="w-full h-full p-8 md:p-12 bg-transparent border-none resize-none outline-none focus-visible:ring-0 font-serif text-lg md:text-xl text-foreground/90 leading-loose placeholder:text-muted-foreground/30 placeholder:italic"
                    placeholder="What is God saying to you today?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                />

                {/* Subtle decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none opacity-50" />
            </div>
        </div>
    );
}
