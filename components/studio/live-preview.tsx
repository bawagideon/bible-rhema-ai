"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { SermonData } from "./sermon-builder";

interface LivePreviewProps {
    data: SermonData;
}

export function LivePreview({ data }: LivePreviewProps) {
    return (
        <div className="relative h-full bg-[#1c1c1c] flex items-center justify-center p-8 overflow-hidden">
            {/* The Desk Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] opacity-50" />

            {/* The Paper */}
            <div className="relative bg-white text-black shadow-2xl w-full max-w-[210mm] aspect-[210/297] h-full max-h-[90vh] overflow-y-auto px-[25mm] py-[25mm] mx-auto transition-transform duration-300 ease-in-out">

                {/* Paper Header */}
                <div className="text-center mb-12 opacity-40">
                    <span className="font-serif text xs tracking-[0.3em] uppercase">Rhema AI Studio</span>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight">
                            {data.title || "Untitled Sermon"}
                        </h1>
                        {data.scripture && (
                            <p className="font-serif italic text-xl text-gray-600 border-b-2 border-primary/20 inline-block pb-2">
                                {data.scripture}
                            </p>
                        )}
                    </div>

                    <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {data.notes || <span className="text-gray-300 italic">Start typing to see your content appear here...</span>}
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="absolute bottom-8 right-8">
                <Button className="rounded-full h-14 w-14 shadow-xl bg-[#D4AF37] hover:bg-[#b5952f] text-black">
                    <Download className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
