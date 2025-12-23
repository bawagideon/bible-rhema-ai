"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Bold, Italic, List, Heading1, Heading2, Quote, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TipTapEditorProps {
    content: string;
    onChange: (html: string) => void;
    onAiAction?: (action: string, editor: any) => void;
    isAiLoading?: boolean;
}

export function TipTapEditor({ content, onChange, onAiAction, isAiLoading }: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Type \'/\' for AI commands or start writing...',
            }),
            Typography,
        ],
        content: content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                // The "Page" look: specific width, white background, shadow, padding
                class: 'min-h-[842px] w-[595px] md:w-[700px] lg:w-[850px] mx-auto bg-[var(--bg-canvas,#ffffff)] text-[var(--color-text,#black)]  p-[50px] md:p-[70px] shadow-2xl focus:outline-none prose prose-lg prose-headings:font-serif prose-p:leading-[var(--leading-editor,1.75)] font-[family-name:var(--font-editor,inherit)]',
                style: 'font-family: var(--font-editor, serif); line-height: var(--leading-editor, 1.75);'
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (content === "" || (!editor.isFocused && content.length > 0)) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full items-center bg-[#0a0a0a] overflow-hidden relative">
            {/* Sticky Toolbar */}
            <div className="sticky top-0 z-20 w-fit mt-4 bg-[#1a1a1a] border border-gray-800 rounded-full px-4 py-1.5 flex items-center gap-1 shadow-2xl backdrop-blur-md">
                <ToolbarButton
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    icon={<Bold className="h-4 w-4" />}
                />
                <ToolbarButton
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    icon={<Italic className="h-4 w-4" />}
                />
                <div className="w-px h-4 bg-gray-700 mx-1" />
                <ToolbarButton
                    isActive={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    icon={<Heading1 className="h-4 w-4" />}
                />
                <ToolbarButton
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    icon={<Heading2 className="h-4 w-4" />}
                />
                <div className="w-px h-4 bg-gray-700 mx-1" />
                <ToolbarButton
                    isActive={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    icon={<Quote className="h-4 w-4" />}
                />

                <div className="w-px h-6 bg-gray-700 mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 gap-2 font-medium"
                        >
                            {isAiLoading ? <Sparkles className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            Assist
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-gray-800 text-gray-200">
                        <DropdownMenuItem onClick={() => onAiAction?.('expand', editor)} className="focus:bg-gray-800 focus:text-white cursor-pointer">
                            <Sparkles className="mr-2 h-3 w-3 text-purple-500" /> Expand
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAiAction?.('rephrase', editor)} className="focus:bg-gray-800 focus:text-white cursor-pointer">
                            <Wand2 className="mr-2 h-3 w-3 text-blue-500" /> Rephrase
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAiAction?.('scripture', editor)} className="focus:bg-gray-800 focus:text-white cursor-pointer">
                            <Quote className="mr-2 h-3 w-3 text-amber-500" /> Add Scripture
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* The Editor Canvas Container */}
            <div
                className="flex-1 w-full overflow-y-auto p-8 md:p-12 cursor-text flex justify-center [scrollbar-width:none] [-ms-overflow-style:none]"
                onClick={() => editor.chain().focus().run()}
            >
                <div className="relative mb-20">
                    {/* Editor */}
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}

function ToolbarButton({ isActive, onClick, icon }: { isActive: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400",
                isActive && "text-[#D4AF37] bg-[#D4AF37]/10"
            )}
            type="button"
        >
            {icon}
        </button>
    )
}

