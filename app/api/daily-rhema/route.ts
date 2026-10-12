import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

const CANONICAL_DAILY_PRESETS = [
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
    },
    {
        scripture_text: "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls.",
        scripture_ref: "Matthew 11:28-29 (ESV)",
        content: "Jesus offers an exchange: your exhausting striving for His gentle yoke. In His presence, soul rest is not an elusive reward to earn, but a gift received through humble faith.",
        prayer_focus: "Savior, I lay down my heavy burdens at Your feet. Teach me Your gentleness and fill me with Your Sabbath peace."
    },
    {
        scripture_text: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
        scripture_ref: "Proverbs 3:5-6 (ESV)",
        content: "When the way forward seems obscured, our calling is not to manufacture certainty, but to practice wholehearted trust. Acknowledge God in the small decisions today.",
        prayer_focus: "Lord, I yield my finite understanding to Your eternal wisdom. Order my steps and make my path straight."
    }
];

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const today = new Date().toISOString().split('T')[0];
        const dayIndex = Math.abs(new Date().getDate()) % CANONICAL_DAILY_PRESETS.length;
        const preset = CANONICAL_DAILY_PRESETS[dayIndex];

        const supabase = getSupabaseServerClient();

        // 1. Check if user already has a saved devotional for today
        const { data: storedRhema, error: fetchErr } = await supabase
            .from('daily_rhema')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();

        if (fetchErr) {
            console.error("Error fetching daily_rhema from database:", fetchErr);
            return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
        }

        if (storedRhema) {
            return NextResponse.json({
                success: true,
                data: {
                    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                    scripture_text: storedRhema.scripture_text,
                    scripture_ref: storedRhema.scripture_ref,
                    content: storedRhema.content,
                    prayer_focus: storedRhema.prayer_focus || "Lord, grant me wisdom to walk in Your truth today."
                }
            });
        }

        // 2. Persist today's word for the user with unique date constraint
        const { error: insertErr } = await supabase
            .from('daily_rhema')
            .upsert({
                user_id: userId,
                date: today,
                scripture_text: preset.scripture_text,
                scripture_ref: preset.scripture_ref,
                content: preset.content,
                prayer_focus: preset.prayer_focus
            }, { onConflict: 'user_id,date', ignoreDuplicates: true });

        if (insertErr) {
            console.warn("Could not persist daily_rhema:", insertErr);
        }

        // 3. Record user activity for streak
        await recordUserActivity(userId);

        return NextResponse.json({
            success: true,
            data: {
                date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                ...preset
            }
        });

    } catch (e: any) {
        console.error("Error in GET /api/daily-rhema:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to load daily rhema" }, { status: 500 });
    }
}
