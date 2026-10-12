import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Please sign in to join in prayer." }, { status: 401 });
        }

        const body = await req.json();
        const { prayerId } = body;

        if (!prayerId || typeof prayerId !== 'string') {
            return NextResponse.json({ success: false, error: "Valid prayer ID is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // 1. Fetch target prayer and verify it is public and active
        const { data: prayer, error: fetchErr } = await supabase
            .from('prayers')
            .select('id, prayed_count, is_community, status, title')
            .eq('id', prayerId)
            .single();

        if (fetchErr || !prayer) {
            return NextResponse.json({ success: false, error: "Prayer request not found" }, { status: 404 });
        }

        // Privacy check: users cannot intercede on private requests
        if (!prayer.is_community) {
            return NextResponse.json({
                success: false,
                error: "This prayer request is private to the author and not open for community intercession."
            }, { status: 403 });
        }

        if (prayer.status === 'archived') {
            return NextResponse.json({
                success: false,
                error: "This prayer request has been archived."
            }, { status: 400 });
        }

        // 2. Execute atomic database RPC function
        const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_prayer_intercession', {
            p_prayer_id: prayerId,
            p_user_id: userId
        });

        if (rpcError) {
            console.error("[PRAYER INTERCEDE RPC ERROR]:", rpcError);
            return NextResponse.json({
                success: false,
                error: rpcError.message || "Failed to record intercession"
            }, { status: 500 });
        }

        if (rpcResult === false) {
            // Already prayed or request not active/public
            return NextResponse.json({
                success: true,
                message: "You have already joined in prayer for this request.",
                prayedCount: prayer.prayed_count || 1,
                alreadyPrayed: true
            });
        }

        // Fetch freshly incremented count
        const { data: updatedPrayer } = await supabase
            .from('prayers')
            .select('prayed_count')
            .eq('id', prayerId)
            .single();

        const newCount = updatedPrayer?.prayed_count || (prayer.prayed_count || 0) + 1;

        // 3. Record authentic user activity for prayer streak
        await recordUserActivity(userId);

        return NextResponse.json({
            success: true,
            message: "Amen! Your prayer was recorded.",
            prayedCount: newCount,
            alreadyPrayed: false
        });

    } catch (e: any) {
        console.error("Error in POST /api/prayers/intercede:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to record intercession" }, { status: 500 });
    }
}
