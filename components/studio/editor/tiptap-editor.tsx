"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Heading1, Heading2, Quote, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                placeholder: 'Type \'/\' for commands...',
            }),
            Typography,
        ],
        content: content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'min-h-[600px] w-full max-w-[850px] mx-auto bg-white text-black p-12 shadow-sm focus:outline-none prose prose-lg prose-headings:font-serif prose-p:leading-relaxed',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync external content changes only if significantly different to prevent cursor jumps
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (content === "" || (!editor.isFocused && content.length > 0)) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full items-center bg-[#f0f0f0] overflow-hidden relative">
            {/* Toolbar - Fixed at top of editor area */}
            <div className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-2 flex items-center justify-center gap-2 shadow-sm">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
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
                    <div className="w-px h-4 bg-gray-300 mx-1" />
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
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <ToolbarButton
                        isActive={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        icon={<List className="h-4 w-4" />}
                    />
                    <ToolbarButton
                        isActive={editor.isActive('blockquote')}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        icon={<Quote className="h-4 w-4" />}
                    />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border-0 shadow-md gap-2"
                            disabled={isAiLoading}
                        >
                            {isAiLoading ? <Sparkles className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            AI Assist
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onAiAction?.('expand', editor)}>
                            <Sparkles className="mr-2 h-3 w-3 text-purple-500" /> Expand Selection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAiAction?.('rephrase', editor)}>
                            <Wand2 className="mr-2 h-3 w-3 text-indigo-500" /> Rephrase
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAiAction?.('scripture', editor)}>
                            <Quote className="mr-2 h-3 w-3 text-amber-500" /> Add Scripture
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 w-full overflow-y-auto p-8" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
                <div className="h-20" /> {/* Bottom Spacer */}
            </div>
        </div>
    );
}

function ToolbarButton({ isActive, onClick, icon }: { isActive: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-md transition-all hover:bg-gray-200 text-gray-700",
                isActive && "bg-white text-black shadow-sm ring-1 ring-black/5"
            )}
        >
            {icon}
        </button>
    )
}
