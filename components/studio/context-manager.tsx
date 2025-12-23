"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, BookOpen, Quote } from "lucide-react";

export interface ContextItem {
    id: string;
    type: 'scripture' | 'quote' | 'note';
    content: string;
    label: string;
}

interface ContextManagerProps {
    contextItems: ContextItem[];
    onAddContext: (item: ContextItem) => void;
    onRemoveContext: (id: string) => void;
}

export function ContextManager({ contextItems, onAddContext, onRemoveContext }: ContextManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [newLabel, setNewLabel] = useState("");

    const handleAdd = () => {
        if (!newContent.trim()) return;

        const newItem: ContextItem = {
            id: crypto.randomUUID(),
            type: 'note', // Default for now
            content: newContent,
            label: newLabel || newContent.substring(0, 20) + "..."
        };

        onAddContext(newItem);
        setNewContent("");
        setNewLabel("");
        setIsOpen(false);
    };

    return (
        <div className="border border-border rounded-lg bg-card/50 overflow-hidden">
            <div className="p-3 bg-muted/50 border-b border-border flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-3 w-3" /> Context Engine
                </h3>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {contextItems.length} active
                </span>
            </div>

            <div className="p-3 space-y-3">
                {/* Active Chips */}
                <div className="flex flex-wrap gap-2">
                    {contextItems.map(item => (
                        <div key={item.id} className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1 text-xs shadow-sm hover:border-primary/50 transition-colors group">
                            <span className="max-w-[120px] truncate">{item.label}</span>
                            <button
                                onClick={() => onRemoveContext(item.id)}
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {contextItems.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No context loaded. AI will rely on general doctrine.</p>
                    )}
                </div>

                {/* Add New */}
                {isOpen ? (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        <input
                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                            placeholder="Label (e.g. 'My Testimony')"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                        />
                        <Textarea
                            placeholder="Paste scripture, quotes, or notes here..."
                            className="text-xs min-h-[80px]"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-7 text-xs">Cancel</Button>
                            <Button size="sm" onClick={handleAdd} className="h-7 text-xs bg-[#D4AF37] text-black hover:bg-[#b5952f]">Add Context</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(true)}
                        className="w-full text-xs h-8 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add Reference Material
                    </Button>
                )}
            </div>
        </div>
    );
}
