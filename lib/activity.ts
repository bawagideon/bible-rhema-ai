import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Record an activity touchpoint for a user and calculate their daily streak.
 * Handles:
 * - Same-day action: maintains streak, does not double count
 * - Yesterday action: increments streak by 1, updates longest_streak
 * - Missed day (> 1 day ago) or first action: sets streak to 1
 * - Atomic write to user_stats
 */
export async function recordUserActivity(userId: string): Promise<{ streak: number; longestStreak: number }> {
    if (!userId) return { streak: 0, longestStreak: 0 };

    try {
        const supabase = getSupabaseServerClient();
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

        // 1. Fetch current stats
        const { data: stats } = await supabase
            .from('user_stats')
            .select('prayer_streak_days, longest_streak_days, last_active_date')
            .eq('user_id', userId)
            .maybeSingle();

        let currentStreak = stats?.prayer_streak_days || 0;
        let longestStreak = stats?.longest_streak_days || 0;
        const lastActive = stats?.last_active_date;

        if (!lastActive) {
            currentStreak = 1;
            longestStreak = Math.max(longestStreak, 1);
        } else if (lastActive === todayStr) {
            // Already active today; do not increment, maintain streak
            currentStreak = Math.max(currentStreak, 1);
        } else {
            const lastDate = new Date(lastActive);
            const todayDate = new Date(todayStr);
            const diffTime = todayDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Active yesterday! Increment streak
                currentStreak += 1;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else if (diffDays > 1) {
                // Missed one or more days: Reset streak to 1
                currentStreak = 1;
            }
        }

        // 2. Persist updated stats
        await supabase
            .from('user_stats')
            .upsert({
                user_id: userId,
                prayer_streak_days: currentStreak,
                longest_streak_days: Math.max(longestStreak, currentStreak),
                last_active_date: todayStr
            }, { onConflict: 'user_id' });

        return { streak: currentStreak, longestStreak };
    } catch (err) {
        console.error("Error recording user activity:", err);
        return { streak: 0, longestStreak: 0 };
    }
}
