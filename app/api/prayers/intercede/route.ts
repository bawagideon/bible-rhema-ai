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

        // 2. Try atomic database RPC function first
        let rpcSuccess = false;
        try {
            const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_prayer_intercession', {
                p_prayer_id: prayerId,
                p_user_id: userId
            });

            if (!rpcError && rpcResult === true) {
                rpcSuccess = true;
            } else if (!rpcError && rpcResult === false) {
                // Already prayed according to RPC uniqueness constraint
                return NextResponse.json({
                    success: true,
                    message: "You have already joined in prayer for this request.",
                    prayedCount: prayer.prayed_count || 1,
                    alreadyPrayed: true
                });
            }
        } catch (rpcEx) {
            rpcSuccess = false;
        }

        // 3. Fallback table logic if RPC is not yet compiled in DB
        let newCount = (prayer.prayed_count || 0) + 1;
        if (!rpcSuccess) {
            // Check prayer_intercessions table
            const { data: existingIntercession } = await supabase
                .from('prayer_intercessions')
                .select('id')
                .eq('prayer_id', prayerId)
                .eq('user_id', userId)
                .maybeSingle();

            if (existingIntercession) {
                return NextResponse.json({
                    success: true,
                    message: "You have already joined in prayer for this request.",
                    prayedCount: prayer.prayed_count || 1,
                    alreadyPrayed: true
                });
            }

            // Insert new intercession record
            const { error: insertErr } = await supabase
                .from('prayer_intercessions')
                .insert({
                    prayer_id: prayerId,
                    user_id: userId
                });

            if (insertErr) {
                if (insertErr.code === '23505' || insertErr.message?.toLowerCase().includes('unique')) {
                    return NextResponse.json({
                        success: true,
                        message: "You have already joined in prayer for this request.",
                        prayedCount: prayer.prayed_count || 1,
                        alreadyPrayed: true
                    });
                }
                throw insertErr;
            }

            // Increment prayed_count on prayer
            await supabase
                .from('prayers')
                .update({
                    prayed_count: newCount
                })
                .eq('id', prayerId);
        } else {
            // Fetch updated count
            const { data: updatedPrayer } = await supabase
                .from('prayers')
                .select('prayed_count')
                .eq('id', prayerId)
                .single();
            if (updatedPrayer?.prayed_count) {
                newCount = updatedPrayer.prayed_count;
            }
        }

        // 4. Record authentic user activity for prayer streak
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
