"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { SermonPdfTemplate } from "./sermon-pdf-template";
import type { SermonData } from "./sermon-builder";

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground p-8 bg-[#1c1c1c]">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#D4AF37]" />
                <span className="font-serif italic text-gray-400">Preparing Sanctuary Paper...</span>
            </div>
        ),
    }
);

interface LivePreviewProps {
    data: SermonData;
}

export function LivePreview({ data }: LivePreviewProps) {
    return (
        <div className="h-full w-full bg-[#1c1c1c] border-l border-border/40 shadow-inner p-0 overflow-hidden">
            <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                <SermonPdfTemplate
                    title={data.title}
                    scripture={data.scripture}
                    content={data.notes}
                />
            </PDFViewer>
        </div>
    );
}
