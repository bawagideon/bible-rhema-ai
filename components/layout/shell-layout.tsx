"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
    Library,
    MessageCircle,
    Home,
    PanelRightClose,
    PanelRightOpen,
    ChevronLeft,
    ChevronRight,
    Menu,
    Settings,
    LogOut,
    Flame,
    Wind,
    Palette
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { RightPanel } from "@/components/layout/right-panel";
import { useRhema } from "@/lib/store/rhema-context";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabaseClient";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalAudioPlayer } from "@/components/layout/global-audio-player";
import { OfflineBanner } from "@/components/system/offline-banner";

interface ShellLayoutProps {
    children: React.ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user: featureUser } = useFeatureAccess();
    const { isRightPanelOpen, toggleRightPanel, userName, userRole } = useRhema();

    // Clerk Hooks
    const { getToken } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();

    // "Self-Healing" Profile Sync for Localhost
    useEffect(() => {
        const syncProfile = async () => {
            if (!user) return;

            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabase = createClerkSupabaseClient(token);

            // 1. Check if profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, has_completed_onboarding')
                .eq('id', user.id)
                .single();

            // Refined Logic for Profile Check & Creation
            let currentProfile = profile;

            if (!profile) {
                console.log("Creating missing profile for localhost...");
                const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
                    id: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    full_name: user.fullName,
                    tier: 'SEEKER',
                    has_completed_onboarding: false
                }).select().single();

                if (newProfile) currentProfile = newProfile;
            }

            // 3. Onboarding Check
            // Prevent redirect loop if already on /onboarding
            if (currentProfile && !currentProfile.has_completed_onboarding && pathname !== '/onboarding') {
                console.log("Redirecting to Onboarding...");
                router.push('/onboarding');
            }
        };

        syncProfile();
    }, [user, getToken, pathname, router]);

    const navItems = [
        { name: "Today", href: "/", icon: Home },
        { name: "SpiritOS", href: "/spirit-os", icon: MessageCircle },
        { name: "Sermon Studio", href: "/studio", icon: Palette },
        { name: "The Altar", href: "/altar", icon: Flame },
        { name: "Sanctuary", href: "/sanctuary", icon: Wind },
        { name: "Library", href: "/library", icon: Library },
    ];

    // Immersive Mode Logic (Cinema Mode for Sanctuary)
    const isImmersive = pathname === '/sanctuary';

    return (
        <div className="flex h-screen bg-background overflow-hidden relative font-sans">
            {/* LEFT SIDEBAR (Desktop) */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r border-border transition-all duration-500 ease-in-out z-20 bg-card/60 backdrop-blur-md fixed md:relative h-full",
                    isSidebarCollapsed ? "w-[64px]" : "w-[240px]",
                    isImmersive && "-ml-[240px] opacity-0 pointer-events-none" // Slide out
                )}
            >
                <div className={cn("h-16 flex items-center px-4 border-b border-border/60", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                    {!isSidebarCollapsed ? (
                        <Link href="/" className="flex items-center gap-2 overflow-hidden py-1">
                            <BrandLogo variant="primary" />
                        </Link>
                    ) : (
                        <Link href="/" className="flex items-center justify-center">
                            <BrandLogo variant="emblem" />
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1.5 px-3">
                        <TooltipProvider delayDuration={0}>
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Tooltip key={item.name}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all group",
                                                    isActive
                                                        ? "bg-[#D4AF37]/15 text-[#D4AF37] font-semibold border border-[#D4AF37]/30 shadow-sm shadow-[#D4AF37]/5"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                                                    isSidebarCollapsed && "justify-center px-2"
                                                )}
                                            >
                                                <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-[#D4AF37]" : "text-muted-foreground group-hover:text-foreground")} />
                                                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                                            </Link>
                                        </TooltipTrigger>
                                        {isSidebarCollapsed && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-[#141414] border-gray-800 text-white font-medium text-xs">
                                                {item.name}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </nav>
                </ScrollArea>

                <div className="p-3 border-t border-border/60 bg-card/40">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className={cn("flex items-center gap-3 cursor-pointer hover:bg-muted/60 p-2 rounded-xl transition-all border border-border/40", isSidebarCollapsed && "justify-center p-1.5")}>
                                <div className="h-8 w-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xs ring-1 ring-[#D4AF37]/40 uppercase shrink-0">
                                    {(userName || user?.firstName || 'G').charAt(0)}
                                </div>
                                {!isSidebarCollapsed && (
                                    <div className="flex flex-col overflow-hidden text-left flex-1 min-w-0">
                                        <span className="text-xs font-semibold truncate text-foreground">{userName || user?.firstName || 'Gideon'}</span>
                                        <Link
                                            href="/pricing"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-[10px] text-[#D4AF37] hover:underline truncate font-medium flex items-center gap-1"
                                        >
                                            {userRole || 'SEEKER'} Plan · Upgrade
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[210px] ml-2 bg-[#141416] border-gray-800 text-white">
                            <DropdownMenuItem onClick={() => router.push('/settings')} className="text-xs py-2 cursor-pointer focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Profile & Preferences</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/pricing')} className="text-xs py-2 cursor-pointer focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                                <Palette className="mr-2 h-4 w-4 text-[#D4AF37]" />
                                <span>Plans & Upgrades</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => signOut()} className="text-xs py-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <div className={cn(
                "md:hidden fixed top-0 w-full h-14 border-b border-border bg-background flex items-center px-4 justify-between z-50 transition-all duration-500",
                isImmersive && "-translate-y-full opacity-0"
            )}>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] max-w-[300px] p-0 flex flex-col justify-between">
                        <div>
                            <div className="h-14 flex items-center px-6 border-b border-border">
                                <BrandLogo variant="primary" />
                            </div>
                            <nav className="flex flex-col gap-1 p-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors",
                                            pathname === item.href ? "bg-muted text-primary font-bold" : "text-muted-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-border space-y-3 bg-card/40">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-8 w-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xs ring-1 ring-[#D4AF37]/40 uppercase shrink-0">
                                    {(userName || user?.firstName || 'G').charAt(0)}
                                </div>
                                <div className="flex flex-col overflow-hidden text-left flex-1 min-w-0">
                                    <span className="text-xs font-semibold truncate text-foreground">{userName || user?.firstName || 'Gideon'}</span>
                                    <Link
                                        href="/pricing"
                                        className="text-[10px] text-[#D4AF37] hover:underline truncate font-medium"
                                    >
                                        {userRole || 'SEEKER'} Plan · Upgrade
                                    </Link>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-border/40 space-y-1">
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Profile & Preferences</span>
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                                >
                                    <Palette className="h-4 w-4" />
                                    <span>Plans & Upgrades</span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <Link href="/" className="flex items-center">
                    <BrandLogo variant="primary" />
                </Link>
                <div className="w-9" /> {/* Spacer */}
            </div>

            {/* MAIN CONTENT AREA */}
            <main className={cn(
                "flex-1 flex flex-col relative h-full transition-all duration-500 overflow-hidden",
                !isImmersive && "md:pt-0 pt-14", // Normal padding
                isImmersive && "pt-0" // Full height in immersive
            )}>
                <OfflineBanner />
                {/* Header/Utility Bar for Center Stage - Option to toggle right panel */}
                <header className={cn(
                    "h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/50 backdrop-blur-xl sticky top-0 z-10 transition-transform duration-500",
                    isImmersive && "-translate-y-full opacity-0 pointer-events-none"
                )}>
                    <h1 className="font-serif text-lg font-medium text-foreground tracking-wide">
                        {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                    </h1>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("text-muted-foreground hover:text-foreground", isRightPanelOpen && "text-primary bg-primary/10")}
                            onClick={toggleRightPanel}
                        >
                            {isRightPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-0 relative">
                    {children}
                </div>
            </main>

            {/* GLOBAL AUDIO PLAYER (Fixed Position) */}
            <GlobalAudioPlayer />

            {/* RIGHT PANEL (Divine Context) */}
            <RightPanel />
        </div>
    );
}
