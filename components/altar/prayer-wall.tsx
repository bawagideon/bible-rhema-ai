"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Flame } from "lucide-react";
import { PrayerCard, type PrayerItem } from "./prayer-card";

const INITIAL_PRAYERS: PrayerItem[] = [
    { id: "1", title: "Healing for Mom's back", tag: "Family", count: 12, isAnswered: false },
    { id: "2", title: "Wisdom for new project", tag: "Work", count: 5, isAnswered: false },
    { id: "3", title: "Peace regarding finances", tag: "Personal", count: 24, isAnswered: true },
];

export function PrayerWall() {
    const [prayers, setPrayers] = useState(INITIAL_PRAYERS);

    const toggleStatus = (id: string, isAnswered: boolean) => {
        // Update local state and map
        const updated = prayers.map(p =>
            p.id === id ? { ...p, isAnswered } : p
        );
        // In a real app we might sort here, but for now just update state
        setPrayers(updated);
    };

    const handleAddPrayer = () => {
        // Simple prompt for now
        const title = window.prompt("What would you like to pray for?");
        if (title) {
            const newPrayer: PrayerItem = {
                id: Date.now().toString(),
                title,
                tag: "New",
                count: 0,
                isAnswered: false
            };
            setPrayers([newPrayer, ...prayers]);
        }
    };

    const activePrayers = prayers.filter(p => !p.isAnswered);
    const answeredPrayers = prayers.filter(p => p.isAnswered);

    return (
        <div className="h-full flex flex-col border-r border-border bg-card/30">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h2 className="font-serif text-xl font-medium">My Prayers</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddPrayer}
                    className="h-8 gap-1 text-muted-foreground hover:text-primary"
                >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Add New</span>
                </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold pl-1">Active</h3>
                        {activePrayers.length === 0 ? (
                            <div className="p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                                The Altar is waiting. Add your first prayer.
                            </div>
                        ) : (
                            activePrayers.map(prayer => (
                                <PrayerCard key={prayer.id} prayer={prayer} onToggleStatus={toggleStatus} />
                            ))
                        )}
                    </div>

                    {answeredPrayers.length > 0 && (
                        <div className="space-y-3 pt-4">
                            <h3 className="text-xs uppercase tracking-widest text-primary/70 font-semibold pl-1">Testimonies</h3>
                            {answeredPrayers.map(prayer => (
                                <PrayerCard key={prayer.id} prayer={prayer} onToggleStatus={toggleStatus} />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                <Button className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold h-12 shadow-lg gap-2">
                    <Flame className="h-4 w-4 fill-black" />
                    Start Intercession Mode
                </Button>
            </div>
        </div>
    );
}
