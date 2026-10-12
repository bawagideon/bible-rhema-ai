"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
    variant?: "primary" | "emblem" | "horizontal";
    className?: string;
    priority?: boolean;
}

export function BrandLogo({
    variant = "primary",
    className,
    priority = true
}: BrandLogoProps) {
    if (variant === "emblem") {
        return (
            <div className={cn("relative flex items-center justify-center group", className)}>
                <div className="absolute inset-0 bg-[#D4AF37]/25 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Image
                    src="/files/bible-rhema-ai-emblem.png"
                    alt="Bible Rhema AI"
                    width={32}
                    height={32}
                    className="relative object-contain h-7 w-auto transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(212,175,55,0.3)]"
                    priority={priority}
                />
            </div>
        );
    }

    return (
        <div className={cn("relative flex items-center gap-2 group select-none", className)}>
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/15 to-[#D4AF37]/0 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
            <Image
                src="/files/bible-rhema-ai-logo-primary.svg"
                alt="Bible Rhema AI — Scripture first. Always."
                width={160}
                height={40}
                className="relative object-contain h-8 w-auto transition-all duration-300 group-hover:brightness-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.2)] group-hover:drop-shadow-[0_0_16px_rgba(212,175,55,0.55)]"
                priority={priority}
            />
        </div>
    );
}
