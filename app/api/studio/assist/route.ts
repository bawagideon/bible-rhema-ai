import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { generateStudioAssist } from "@/lib/ai/gemini";

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
                error: "Sermon Studio AI assist requires the Minister tier."
            }, { status: 403 });
        }

        const body = await req.json();
        const { action = 'expand', text = "" } = body;

        const content = await generateStudioAssist(action, text);

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
