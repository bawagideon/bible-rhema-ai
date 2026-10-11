import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { generateSermonAI } from "@/lib/ai/gemini";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        // Verify Minister tier entitlement on the server
        const supabase = getSupabaseServerClient();
        const { data: profile } = await supabase.from('profiles').select('tier').eq('id', userId).single();
        const userTier = profile?.tier || 'SEEKER';

        if (userTier !== 'MINISTER') {
            return NextResponse.json({
                success: false,
                error: "Sermon Studio AI generation requires the Minister tier."
            }, { status: 403 });
        }

        // Parse sermon prompt details
        const body = await req.json();
        const { title, scripture, tone, context = [], notes = "" } = body;

        const content = await generateSermonAI({
            title: title || "Walking in Kingdom Authority",
            scripture: scripture || "Matthew 28:18-20",
            tone: tone || "Theological",
            context,
            notes
        });

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
