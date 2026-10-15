"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, Copy, Check, Plus } from "lucide-react";
import { toast } from "sonner";

interface IllustrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    topic: string;
    scripture: string;
    onInsertIllustration: (text: string) => void;
}

export function IllustrationDialog({ open, onOpenChange, topic, scripture, onInsertIllustration }: IllustrationDialogProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const illustrations = [
        {
            title: "The Judean Vinedresser's Care",
            category: "Historical & Agricultural",
            content: "In ancient Judean vineyards, branches growing close to the ground would get coated in heavy soil and dust, suffocating the fruit. Rather than severing the branch, the vinedresser would lift it up, wash it with clean water, and tie it to a trellis so it could catch the morning sun. Christ does not cut down struggling believers; He lifts us from the dust.",
            application: "Point I: Sanctification and gentle cleansing of the Father."
        },
        {
            title: "The Copper Wire and the Power Grid",
            category: "Contemporary Analogy",
            content: "A copper lamp wire cannot produce light on its own no matter how polished or thick it is. Its only function is to remain in constant, unbroken contact with the electrical terminal. The moment it disconnects, the darkness returns. We are conduits of divine light, not the power source.",
            application: "Point II: Total dependence and abiding in Christ."
        },
        {
            title: "The Grafted Olive Tree",
            category: "Biblical Typology",
            content: "When a wild olive shoot is grafted into a cultivated root, it takes weeks of binding and sap exchange before the branch drinks the life of the parent tree. Our prayers and daily time in the Word are the binding cords through which Christ's life flows into our soul.",
            application: "Point III: Sustained communion producing lasting fruit."
        }
    ];

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success("Illustration copied to clipboard");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleInsert = (text: string) => {
        onInsertIllustration(`<div class="illustration-box bg-gold-950/20 p-4 border-l-4 border-gold my-4 rounded-r-lg"><strong>Homiletical Illustration:</strong> ${text}</div>`);
        onOpenChange(false);
        toast.success("Illustration inserted into manuscript");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-[#141416] border-[#D4AF37]/40 text-white p-6 md:p-8 font-sans">
                <DialogHeader className="space-y-2 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-0 text-[10px] font-mono uppercase tracking-wider">
                            HOMILETICS ASSISTANT
                        </Badge>
                    </div>
                    <DialogTitle className="font-serif text-2xl text-white">
                        Sermon Illustration Ideas
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs">
                        Contextually grounded illustrations to illuminate <em>{topic || "your sermon"}</em> ({scripture || "Scripture"}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3 max-h-[50vh] overflow-y-auto">
                    {illustrations.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#18181a] border border-gray-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h4 className="font-serif font-semibold text-white text-sm flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
                                    {item.title}
                                </h4>
                                <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400">
                                    {item.category}
                                </Badge>
                            </div>

                            <p className="text-xs text-gray-300 leading-relaxed">
                                {item.content}
                            </p>

                            <p className="text-[11px] text-[#D4AF37] italic font-serif">
                                Application: {item.application}
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800/60">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopy(item.content, idx)}
                                    className="text-xs text-gray-400 hover:text-white h-7 px-2.5"
                                >
                                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                    {copiedIndex === idx ? "Copied" : "Copy"}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleInsert(item.content)}
                                    className="text-xs bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold h-7 px-3"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Insert in Manuscript
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs text-gray-400 hover:text-white">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
