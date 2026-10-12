import { getSupabaseServerClient } from "./supabase-server.ts";

/**
 * Concurrency-safe, atomic activity touchpoint logging and streak transitions.
 * Delegates to PostgreSQL `record_atomic_user_activity` RPC with row-level locks
 * preventing race conditions between concurrent requests.
 */
export async function recordUserActivity(userId: string): Promise<{ streak: number; longestStreak: number }> {
    if (!userId) return { streak: 0, longestStreak: 0 };

    try {
        const supabase = getSupabaseServerClient();
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

        // Atomic PostgreSQL RPC execution with row lock 'FOR UPDATE'
        const { data, error } = await supabase.rpc('record_atomic_user_activity', {
            p_user_id: userId,
            p_today: todayStr
        });

        if (error) {
            console.error("[ACTIVITY STREAK ERROR] Atomic RPC error:", error);
            // Read-only fallback without blind overwriting
            const { data: stats } = await supabase
                .from('user_stats')
                .select('prayer_streak_days, longest_streak_days')
                .eq('user_id', userId)
                .maybeSingle();

            return {
                streak: stats?.prayer_streak_days || 1,
                longestStreak: stats?.longest_streak_days || 1
            };
        }

        const row = Array.isArray(data) ? data[0] : data;
        return {
            streak: row?.prayer_streak_days ?? 1,
            longestStreak: row?.longest_streak_days ?? 1
        };
    } catch (err) {
        console.error("Error recording user activity:", err);
        return { streak: 0, longestStreak: 0 };
    }
}
