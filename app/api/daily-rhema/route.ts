import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const DAILY_BREAD_PRESETS = [
    {
        scripture_text: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
        scripture_ref: "Psalm 23:1-3 (ESV)",
        content: "True peace is not the absence of life's demands, but the presence of the Good Shepherd walking beside you. Today, surrender every anxious calculation and rest in His unfailing covenant care.",
        prayer_focus: "Lord Jesus, lead me beside still waters today. Restore my soul where I have grown weary, and align my thoughts with Your truth."
    },
    {
        scripture_text: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.",
        scripture_ref: "Jeremiah 29:11 (ESV)",
        content: "Even when circumstances appear unpredictable, God's redemptive architecture is already at work. His sovereignty guarantees that no season of difficulty will have the final word in your life.",
        prayer_focus: "Father, anchor my trust in Your faithful promises. Grant me courage to step into the future You have prepared."
    },
    {
        scripture_text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
        scripture_ref: "Romans 8:28 (ESV)",
        content: "God does not waste any trial, tear, or delay. In the hands of the Master Potter, every detail is being redeemed for eternal glory and kingdom maturity.",
        prayer_focus: "Holy Spirit, give me kingdom perspective to see beyond the immediate, knowing You are orchestrating all things for good."
    }
];

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const dayIndex = new Date().getDate() % DAILY_BREAD_PRESETS.length;
        const preset = DAILY_BREAD_PRESETS[dayIndex];

        // Format return
        return NextResponse.json({
            success: true,
            data: {
                date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                ...preset
            }
        });
    } catch (e: any) {
        return NextResponse.json({
            success: true,
            data: {
                date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                ...DAILY_BREAD_PRESETS[0]
            }
        });
    }
}
