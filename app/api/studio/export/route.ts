import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

/**
 * Server-Side Authorization Endpoint for Sermon Studio PDF Export.
 * Ensures only users with the verified 'MINISTER' tier in PostgreSQL can export manuscripts.
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
            .select('tier')
            .eq('id', userId)
            .maybeSingle();

        if (profileErr) {
            console.error("Profile check error in studio/export:", profileErr);
            return NextResponse.json({ success: false, error: profileErr.message }, { status: 500 });
        }

        const userTier = profile?.tier || 'SEEKER';

        if (userTier !== 'MINISTER') {
            return NextResponse.json({
                success: false,
                error: "Manuscript PDF export requires an active Minister covenant membership. Please upgrade in Covenant Membership."
            }, { status: 403 });
        }

        // Record user activity
        await recordUserActivity(userId);

        return NextResponse.json({
            success: true,
            authorized: true,
            tier: 'MINISTER',
            message: "Authorized for sermon manuscript PDF export."
        });
    } catch (error: any) {
        console.error("Studio export authorization error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal server error"
        }, { status: 500 });
    }
}
