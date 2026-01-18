import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Flame, Sparkles } from "lucide-react";
import { PrayerCard } from "./prayer-card";
import { PrayerFocusModal } from "./prayer-focus-modal";
import { cn } from "@/lib/utils";

// Types need to be exported or shared, redefining locally for now if not in shared file
export interface PrayerItem {
    id: string;
    title: string;
    tag: string;
    count: number;
    isAnswered: boolean;
    ai_strategy?: string;
    scripture_ref?: string;
    created_at: string; // Added to match card props
    status: 'active' | 'answered'; // Normalized
}

const INITIAL_PRAYERS: PrayerItem[] = [
    {
        id: "1",
        title: "Healing for Mom's back",
        tag: "Family",
        count: 12,
        isAnswered: false,
        status: 'active',
        created_at: new Date().toISOString(),
        ai_strategy: "Pray for complete restoration of the spinal discs. Declare Psalm 103:3.",
        scripture_ref: "Psalm 103:3"
    },
    {
        id: "2",
        title: "Wisdom for new project",
        tag: "Work",
        count: 5,
        isAnswered: false,
        status: 'active',
        created_at: new Date().toISOString(),
        ai_strategy: "Ask for the Spirit of Wisdom and Revelation. Focus on serving the end user.",
        scripture_ref: "James 1:5"
    },
    {
        id: "3",
        title: "Peace regarding finances",
        tag: "Personal",
        count: 24,
        isAnswered: true,
        status: 'answered',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        ai_strategy: "Trust in Jehovah Jireh. Sow a seed of faith.",
        scripture_ref: "Philippians 4:19"
    },
    {
        id: "4",
        title: "Salvation for brother",
        tag: "Family",
        count: 88,
        isAnswered: false,
        status: 'active',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        ai_strategy: "Bind the blinding spirit. Loose the spirit of adoption.",
        scripture_ref: "Acts 16:31"
    },
];

export function PrayerWall() {
    const [prayers, setPrayers] = useState<PrayerItem[]>(INITIAL_PRAYERS);
    const [selectedPrayer, setSelectedPrayer] = useState<PrayerItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleStatus = (id: string, newStatus: 'active' | 'answered') => {
        const updated = prayers.map(p =>
            p.id === id ? { ...p, status: newStatus, isAnswered: newStatus === 'answered' } : p
        );
        setPrayers(updated);
    };

    const handleDelete = (id: string) => {
        setPrayers(prayers.filter(p => p.id !== id));
    };

    const handleCardClick = (prayer: PrayerItem) => {
        setSelectedPrayer(prayer);
        setIsModalOpen(true);
    };

    const handleAddPrayer = () => {
        const title = window.prompt("What would you like to pray for?");
        if (title) {
            const newPrayer: PrayerItem = {
                id: Date.now().toString(),
                title,
                tag: "New",
                count: 0,
                isAnswered: false,
                status: 'active',
                created_at: new Date().toISOString(),
                ai_strategy: "Seeking the Lord for strategy...",
                scripture_ref: "Romans 8:26"
            };
            setPrayers([newPrayer, ...prayers]);
        }
    };

    const activePrayers = prayers.filter(p => !p.isAnswered);
    const answeredPrayers = prayers.filter(p => p.isAnswered);

    return (
        <div className="h-full flex flex-col bg-background relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-border/40 bg-background/50 backdrop-blur-xl sticky top-0 z-10">
                <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight">The Prayer Wall</h2>
                    <p className="text-sm text-muted-foreground mt-1">"Write the vision, and make it plain..."</p>
                </div>
                <Button
                    onClick={handleAddPrayer}
                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold shadow-lg gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Request
                </Button>
            </div>

            <ScrollArea className="flex-1 p-6 md:p-8">
                {/* MASONRY GRID LAYOUT */}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 pb-20">
                    {/* Render Active Prayers */}
                    {activePrayers.map(prayer => (
                        <div key={prayer.id} className="break-inside-avoid mb-6">
                            <PrayerCard
                                prayer={prayer}
                                onStatusChange={toggleStatus}
                                onDelete={handleDelete}
                                onClick={() => handleCardClick(prayer)}
                            />
                        </div>
                    ))}

                    {/* Placeholder Logic if empty */}
                    {activePrayers.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl opacity-50">
                            <Flame className="w-12 h-12 text-muted-foreground mb-4" />
                            <p>The Altar is clear. Light a fire.</p>
                        </div>
                    )}
                </div>

                {/* Answered Section (Below Grid) */}
                {answeredPrayers.length > 0 && (
                    <div className="mt-12 border-t border-border/50 pt-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                            <h3 className="text-lg font-serif font-bold">Testimonies</h3>
                        </div>
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                            {answeredPrayers.map(prayer => (
                                <div key={prayer.id} className="break-inside-avoid mb-6 opacity-80">
                                    <PrayerCard
                                        prayer={prayer}
                                        onStatusChange={toggleStatus}
                                        onDelete={handleDelete}
                                        onClick={() => handleCardClick(prayer)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>

            {/* MODAL */}
            <PrayerFocusModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                prayer={selectedPrayer}
            />
        </div>
    );
}
