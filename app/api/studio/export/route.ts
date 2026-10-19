import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";
import { verifyUserTierEntitlement } from "@/lib/billing/entitlements";

export const dynamic = 'force-dynamic';

/**
 * Server-Side Authorization Endpoint for Sermon Studio PDF Export.
 * Validates Minister tier covenant entitlement and active subscription lifecycle.
 * Note: This endpoint authorizes client-side PDF manuscript export as a Minister covenant feature.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: "Authentication required to export sermon manuscript."
            }, { status: 401 });
        }

        // Verify Minister tier entitlement directly against PostgreSQL via Supabase Service Role
        const supabase = getSupabaseServerClient();
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('id, tier, subscription_status, current_period_end')
            .eq('id', userId)
            .maybeSingle();

        if (profileErr) {
            console.error("Profile check database error in studio/export:", profileErr.message);
            return NextResponse.json({
                success: false,
                error: "An unexpected database error occurred while verifying covenant entitlement."
            }, { status: 500 });
        }

        const entitlement = verifyUserTierEntitlement(profile, 'MINISTER');

        if (!entitlement.isEntitled) {
            return NextResponse.json({
                success: false,
                error: entitlement.reason || "Manuscript PDF export requires an active Minister covenant membership. Please upgrade in Covenant Membership."
            }, { status: 403 });
        }

        // Record user activity non-blockingly so telemetry failure does not reject authorized export
        try {
            await recordUserActivity(userId);
        } catch (actErr: any) {
            console.warn("Non-fatal activity record error during PDF export:", actErr?.message);
        }

        return NextResponse.json({
            success: true,
            authorized: true,
            tier: 'MINISTER',
            message: "Authorized for sermon manuscript PDF export."
        });
    } catch (error: any) {
        console.error("Studio export authorization unexpected error:", error);
        return NextResponse.json({
            success: false,
            error: "An unexpected error occurred while verifying manuscript export entitlement."
        }, { status: 500 });
    }
}
