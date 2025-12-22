"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Library,
    MessageCircle,
    Mic,
    Palette,
    Home,
    PanelRightClose,
    PanelRightOpen,
    ChevronLeft,
    ChevronRight,
    Menu
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { RightPanel } from "@/components/layout/right-panel";
import { useRhema } from "@/lib/store/rhema-context";
import { useAuth } from "@/lib/store/auth-context";

interface ShellLayoutProps {
    children: React.ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const { user } = useFeatureAccess();
    const { isRightPanelOpen, toggleRightPanel } = useRhema();
    const { signOut } = useAuth();

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "SpiritOS", href: "/spirit-os", icon: MessageCircle },
        { name: "Altar", href: "/altar", icon: Mic },
        { name: "Studio", href: "/studio", icon: Palette },
        { name: "Library", href: "/library", icon: Library },
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* LEFT SIDEBAR (Desktop) */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r border-border transition-all duration-300 ease-in-out z-20 bg-card/50 backdrop-blur-sm",
                    isSidebarCollapsed ? "w-[60px]" : "w-[240px]"
                )}
            >
                <div className={cn("h-14 flex items-center px-3 border-b border-border", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                    {!isSidebarCollapsed && (
                        <span className="font-serif text-xl font-bold text-primary tracking-tight">RhemaAI</span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-2">
                        <TooltipProvider delayDuration={0}>
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Tooltip key={item.name}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
                                                    isActive ? "bg-muted text-primary font-bold" : "text-muted-foreground",
                                                    isSidebarCollapsed && "justify-center px-2"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {!isSidebarCollapsed && <span>{item.name}</span>}
                                            </Link>
                                        </TooltipTrigger>
                                        {isSidebarCollapsed && (
                                            <TooltipContent side="right" className="flex items-center gap-4">
                                                {item.name}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </nav>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                    <div className={cn("flex items-center gap-3", isSidebarCollapsed && "justify-center")}>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/40">
                            {user.name.charAt(0)}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">{user.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground truncate">{user.role} Plan</span>
                                    <button onClick={() => signOut()} className="text-[10px] text-red-400 hover:underline">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 w-full h-14 border-b border-border bg-background flex items-center px-4 justify-between z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] max-w-[300px] p-0">
                        <div className="h-14 flex items-center px-6 border-b border-border">
                            <span className="font-serif text-xl font-bold text-primary">RhemaAI</span>
                        </div>
                        <nav className="flex flex-col gap-1 p-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors",
                                        pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                <span className="font-serif text-lg font-bold">RhemaAI</span>
                <div className="w-9" /> {/* Spacer */}
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative h-full md:pt-0 pt-14 overflow-hidden">
                {/* Header/Utility Bar for Center Stage - Option to toggle right panel */}
                <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/50 backdrop-blur-xl sticky top-0 z-10">
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

            {/* RIGHT PANEL (Divine Context) */}
            <RightPanel />
        </div>
    );
}
