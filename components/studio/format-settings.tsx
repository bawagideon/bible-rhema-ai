"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, Type, AlignJustify, Palette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useEffect } from "react";

export interface FormatSettingsState {
    typography: 'serif' | 'sans' | 'mono';
    lineHeight: 'compact' | 'comfortable' | 'relaxed';
    theme: 'modern' | 'parchment' | 'minimalist';
}

interface FormatSettingsProps {
    settings: FormatSettingsState;
    onUpdate: (settings: FormatSettingsState) => void;
}

export function FormatSettings({ settings, onUpdate }: FormatSettingsProps) {

    // Apply CSS Variables globally (or to a specific wrapper class) when settings change
    useEffect(() => {
        const root = document.documentElement;

        // Typography
        if (settings.typography === 'serif') {
            root.style.setProperty('--font-editor', '"Merriweather", serif');
        } else if (settings.typography === 'mono') {
            root.style.setProperty('--font-editor', '"JetBrains Mono", monospace');
        } else {
            root.style.setProperty('--font-editor', '"Inter", sans-serif');
        }

        // Line Height
        if (settings.lineHeight === 'compact') {
            root.style.setProperty('--leading-editor', '1.4');
        } else if (settings.lineHeight === 'relaxed') {
            root.style.setProperty('--leading-editor', '2.0');
        } else {
            root.style.setProperty('--leading-editor', '1.75');
        }

        // Theme (Background Colors) - Handled via class names in parent typically, 
        // but we can set variables for the editor canvas background.
        if (settings.theme === 'parchment') {
            root.style.setProperty('--bg-canvas', '#fcfbf9');
            root.style.setProperty('--color-text', '#1a1a1a');
        } else if (settings.theme === 'minimalist') {
            root.style.setProperty('--bg-canvas', '#ffffff');
            root.style.setProperty('--color-text', '#000000');
        } else { // Modern (Darker Off-white)
            root.style.setProperty('--bg-canvas', '#fcfcfc');
            root.style.setProperty('--color-text', '#222222');
        }

    }, [settings]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Page Formatting</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2">
                    <p className="text-xs font-medium mb-2 flex items-center gap-2"><Type className="h-3 w-3" /> Typography</p>
                    <DropdownMenuRadioGroup value={settings.typography} onValueChange={(v) => onUpdate({ ...settings, typography: v as any })}>
                        <DropdownMenuRadioItem value="serif">Serif (Merriweather)</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="sans">Sans (Inter)</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="mono">Mono (Code)</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                    <p className="text-xs font-medium mb-2 flex items-center gap-2"><AlignJustify className="h-3 w-3" /> Line Height</p>
                    <div className="px-2 py-1">
                        {/* Simplified Select for robustness over slider for now */}
                        <DropdownMenuRadioGroup value={settings.lineHeight} onValueChange={(v) => onUpdate({ ...settings, lineHeight: v as any })}>
                            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="relaxed">Relaxed</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                    <p className="text-xs font-medium mb-2 flex items-center gap-2"><Palette className="h-3 w-3" /> Theme</p>
                    <DropdownMenuRadioGroup value={settings.theme} onValueChange={(v) => onUpdate({ ...settings, theme: v as any })}>
                        <DropdownMenuRadioItem value="modern">Modern Clean</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="parchment">Parchment</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="minimalist">Minimalist</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </div>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
