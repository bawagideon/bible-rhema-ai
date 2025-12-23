"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Layers, Library } from "lucide-react";

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
            type: 'note',
            content: newContent,
            label: newLabel || newContent.substring(0, 20) + "..."
        };

        onAddContext(newItem);
        setNewContent("");
        setNewLabel("");
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#f9fafb] border-r border-[#e5e7eb]">
            {/* Header */}
            <div className="p-4 border-b border-[#e5e7eb] bg-white">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#D4AF37]" />
                    Context Engine
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">
                    Add custom sources for the AI to reference.
                </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {contextItems.length === 0 ? (
                    <div className="text-center py-8 opacity-50">
                        <Library className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs text-gray-500">No context active.</p>
                    </div>
                ) : (
                    contextItems.map(item => (
                        <div key={item.id} className="relative group bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-medium text-gray-800 line-clamp-1">{item.label}</span>
                                <button
                                    onClick={() => onRemoveContext(item.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                                {item.content}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Add Action */}
            <div className="p-3 border-t border-[#e5e7eb] bg-white">
                {isOpen ? (
                    <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                        <input
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                            placeholder="Title (e.g. 'My Journal')"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                        />
                        <Textarea
                            placeholder="Paste content here..."
                            className="text-xs min-h-[100px] resize-none bg-gray-50 border-gray-200 focus:ring-[#D4AF37]"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleAdd} size="sm" className="flex-1 bg-[#D4AF37] hover:bg-[#b5952f] text-black text-xs font-medium">
                                Add
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="px-2 text-xs text-gray-500">
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="w-full bg-white border border-dashed border-gray-300 text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] text-xs h-9 shadow-sm"
                    >
                        <Plus className="h-3 w-3 mr-2" /> Add Material
                    </Button>
                )}
            </div>
        </div>
    );
}

