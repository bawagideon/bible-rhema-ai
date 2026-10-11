import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                authenticated: false,
                streak: 0,
                longestStreak: 0,
                prayersCount: 0,
                sermonsCount: 0,
                journalCount: 0,
                recentItems: []
            });
        }

        const supabase = getSupabaseServerClient();

        // 1. Fetch Streak & Stats
        const { data: stats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        // 2. Count Real Prayers
        const { count: prayersCount } = await supabase
            .from('prayers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 3. Count Real Sermons
        const { count: sermonsCount } = await supabase
            .from('sermons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 4. Count Real Journal Entries
        let journalCount = 0;
        try {
            const { count } = await supabase
                .from('journal_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            journalCount = count || 0;
        } catch (e) {
            journalCount = 0;
        }

        // 5. Fetch Recent Activities for "Continue Your Walk"
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
        try {
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
        } catch (e) {}

        return NextResponse.json({
            authenticated: true,
            streak: stats?.prayer_streak_days || 0,
            longestStreak: stats?.longest_streak_days || 0,
            totalMinutesPrayed: stats?.total_minutes_prayed || 0,
            prayersCount: prayersCount || 0,
            sermonsCount: sermonsCount || 0,
            journalCount: journalCount || 0,
            recentItems
        });
    } catch (err: any) {
        console.error("Error in /api/user/stats:", err);
        return NextResponse.json({
            authenticated: false,
            streak: 0,
            longestStreak: 0,
            prayersCount: 0,
            sermonsCount: 0,
            journalCount: 0,
            recentItems: []
        });
    }
}
