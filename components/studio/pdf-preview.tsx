"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import type { SermonData } from "./sermon-builder";
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { useRhema } from "@/lib/store/rhema-context";
import { toast } from "sonner";

interface LivePreviewProps {
    data: SermonData;
}

export function LivePreview({ data }: LivePreviewProps) {
    const paperRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { pdfExportTimestamp } = useRhema();

    // Listen for export trigger from Right Panel
    useEffect(() => {
        if (pdfExportTimestamp) {
            handleDownload();
        }
    }, [pdfExportTimestamp]);

    const handleDownload = async () => {
        if (!paperRef.current) return;
        setIsGenerating(true);
        const toastId = toast.loading("Generating PDF...");

        try {
            // Dynamic import to ensure client-side execution
            const html2pdf = (await import('html2pdf.js')).default;

            const element = paperRef.current;
            const opt: any = {
                margin: 10, // mm
                filename: `${data.title || 'sermon'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            toast.success("PDF Downloaded", { id: toastId });
        } catch (error) {
            console.error("PDF Generation failed", error);
            toast.error("Failed to generate PDF", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full w-full bg-[#1c1c1c] flex flex-col items-center p-8 overflow-y-auto relative">
            {/* The Desk Texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] opacity-50 pointer-events-none" />

            {/* The Paper (A4 Aspect Ratio) */}
            <div
                ref={paperRef}
                className="relative bg-white text-black shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[25mm] mx-auto transition-transform duration-300 ease-in-out shrink-0"
            >
                {/* Visual Header */}
                <div className="text-center mb-12 opacity-80 border-b pb-6 border-[#D4AF37]/30">
                    <span className="font-serif text-xs tracking-[0.3em] uppercase text-[#D4AF37] block mb-2">Rhema AI Studio</span>
                    <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-gray-900">
                        {data.title || <span className="text-gray-200">Untitled Sermon</span>}
                    </h1>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {data.scripture && (
                        <div className="bg-[#fcfbf9] border-l-4 border-[#D4AF37] p-6 italic font-serif text-xl text-gray-700">
                            “{data.scripture}”
                        </div>
                    )}

                    <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {data.notes ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkBreaks]}
                                components={{
                                    strong: ({ children }) => <strong className="font-bold text-black">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 leading-tight">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-xl font-bold mt-4 mb-3 border-b pb-1 border-gray-200">{children}</h2>,
                                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 my-4">{children}</ul>,
                                    li: ({ children }) => <li className="pl-1 text-gray-700 leading-relaxed">{children}</li>,
                                    p: ({ children }) => <p className="mb-4 text-justify whitespace-pre-line">{children}</p>,
                                    hr: () => <hr className="my-8 border-t-2 border-gray-200 w-1/3 mx-auto" />, // Handle separators
                                }}
                            >
                                {data.notes}
                            </ReactMarkdown>
                        ) : (
                            <span className="text-gray-300 italic">Start typing your revelation...</span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-end text-[10px] text-gray-400 font-sans uppercase tracking-widest">
                    <span>Generated by RhemaAI</span>
                    <span>Divine Intelligence</span>
                </div>
            </div>

            {/* Spacer for scroll */}
            <div className="h-20 shrink-0" />
        </div>
    );
}