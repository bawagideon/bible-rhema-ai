import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { generateStudioAssist } from "@/lib/ai/gemini";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        // Verify Minister tier entitlement on the server
        const supabase = getSupabaseServerClient();
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', userId)
            .maybeSingle();

        if (profileErr) {
            console.error("Profile check error in studio/assist:", profileErr);
            return NextResponse.json({ success: false, error: profileErr.message }, { status: 500 });
        }

        const userTier = profile?.tier || 'SEEKER';

        if (userTier !== 'MINISTER') {
            return NextResponse.json({
                success: false,
                error: "Sermon Studio AI assist requires the Minister covenant tier. Please upgrade in Covenant Membership."
            }, { status: 403 });
        }

        const body = await req.json();
        const { action = 'expand', text = "" } = body;

        const allowedActions = ['expand', 'rephrase', 'scripture'];
        const safeAction = allowedActions.includes(action) ? (action as 'expand' | 'rephrase' | 'scripture') : 'expand';
        const safeText = typeof text === 'string' ? text.slice(0, 5000) : "";

        if (!safeText.trim()) {
            return NextResponse.json({ success: false, error: "Thought text is required for AI assist" }, { status: 400 });
        }

        const content = await generateStudioAssist(safeAction, safeText);

        await recordUserActivity(userId);

        return NextResponse.json({
            success: true,
            content
        });
    } catch (error: any) {
        console.error("Error in studio assist:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to assist" },
            { status: 500 }
        );
    }
}
