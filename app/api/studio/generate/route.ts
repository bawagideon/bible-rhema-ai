import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { generateSermonAI } from "@/lib/ai/gemini";
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
            console.error("Profile check error in studio/generate:", profileErr);
            return NextResponse.json({ success: false, error: profileErr.message }, { status: 500 });
        }

        const userTier = profile?.tier || 'SEEKER';

        if (userTier !== 'MINISTER') {
            return NextResponse.json({
                success: false,
                error: "Sermon Studio AI generation requires the Minister covenant tier. Please upgrade in Covenant Membership."
            }, { status: 403 });
        }

        // Parse and validate sermon prompt details
        const body = await req.json();
        const { title, scripture, tone, context = [], notes = "" } = body;

        const safeTitle = (title && typeof title === 'string') ? title.slice(0, 300) : "Walking in Kingdom Authority";
        const safeScripture = (scripture && typeof scripture === 'string') ? scripture.slice(0, 100) : "Matthew 28:18-20";
        const safeTone = (tone && typeof tone === 'string') ? tone.slice(0, 50) : "Expository & Theological";
        const safeNotes = (notes && typeof notes === 'string') ? notes.slice(0, 5000) : "";

        const content = await generateSermonAI({
            title: safeTitle,
            scripture: safeScripture,
            tone: safeTone,
            context: Array.isArray(context) ? context.slice(0, 10) : [],
            notes: safeNotes
        });

        // Record user activity
        await recordUserActivity(userId);

        return NextResponse.json({
            success: true,
            content
        });
    } catch (error: any) {
        console.error("Error generating sermon outline:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to generate sermon" },
            { status: 500 }
        );
    }
}
