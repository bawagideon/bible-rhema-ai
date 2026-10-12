import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                authenticated: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const supabase = getSupabaseServerClient();

        // 1. Fetch Streak & Stats
        const { data: stats, error: statsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (statsError) {
            console.error("Error querying user_stats:", statsError);
            return NextResponse.json({ success: false, error: statsError.message }, { status: 500 });
        }

        // 2. Count Real Prayers
        const { count: prayersCount, error: prayersError } = await supabase
            .from('prayers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (prayersError) {
            console.error("Error counting prayers:", prayersError);
            return NextResponse.json({ success: false, error: prayersError.message }, { status: 500 });
        }

        // 3. Count Real Sermons
        const { count: sermonsCount, error: sermonsError } = await supabase
            .from('sermons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (sermonsError) {
            console.error("Error counting sermons:", sermonsError);
            return NextResponse.json({ success: false, error: sermonsError.message }, { status: 500 });
        }

        // 4. Count Real Journal Entries
        const { count: journalCount, error: journalError } = await supabase
            .from('journal_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (journalError) {
            console.error("Error counting journal entries:", journalError);
            return NextResponse.json({ success: false, error: journalError.message }, { status: 500 });
        }

        // 5. Count Real Saved Studies
        const { count: studiesCount } = await supabase
            .from('saved_studies')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 6. Fetch Recent Activities for "Continue Your Walk"
        const recentItems: { id: string; title: string; type: string; href: string; date: string }[] = [];

        // Latest Prayer
        const { data: latestPrayer } = await supabase
            .from('prayers')
            .select('id, title, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (latestPrayer?.[0]) {
            recentItems.push({
                id: latestPrayer[0].id,
                title: latestPrayer[0].title,
                type: 'Altar Prayer',
                href: '/altar',
                date: latestPrayer[0].created_at
            });
        }

        // Latest Sermon
        const { data: latestSermon } = await supabase
            .from('sermons')
            .select('id, title, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (latestSermon?.[0]) {
            recentItems.push({
                id: latestSermon[0].id,
                title: latestSermon[0].title,
                type: 'Sermon Manuscript',
                href: '/studio',
                date: latestSermon[0].updated_at
            });
        }

        // Latest Journal
        const { data: latestJournal } = await supabase
            .from('journal_entries')
            .select('id, title, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (latestJournal?.[0]) {
            recentItems.push({
                id: latestJournal[0].id,
                title: latestJournal[0].title,
                type: 'Spiritual Journal',
                href: '/library',
                date: latestJournal[0].created_at
            });
        }

        // Latest Study
        const { data: latestStudy } = await supabase
            .from('saved_studies')
            .select('id, title, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (latestStudy?.[0]) {
            recentItems.push({
                id: latestStudy[0].id,
                title: latestStudy[0].title,
                type: 'Scripture Study',
                href: '/spirit-os',
                date: latestStudy[0].created_at
            });
        }

        return NextResponse.json({
            authenticated: true,
            streak: stats?.prayer_streak_days || 0,
            longestStreak: stats?.longest_streak_days || 0,
            totalMinutesPrayed: stats?.total_minutes_prayed || 0,
            prayersCount: prayersCount || 0,
            sermonsCount: sermonsCount || 0,
            journalCount: journalCount || 0,
            studiesCount: studiesCount || 0,
            recentItems
        });
    } catch (err: any) {
        console.error("Error in /api/user/stats:", err);
        return NextResponse.json({
            authenticated: false,
            error: err.message || "Failed to load user stats"
        }, { status: 500 });
    }
}
