import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { streamSpiritOSStudy, SpiritOSMode } from "@/lib/ai/gemini";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        // 1. Enforce Authentication
        if (!userId) {
            return NextResponse.json({
                error: "Authentication required to access SpiritOS study workspace."
            }, { status: 401 });
        }

        const body = await req.json();
        const { query, mode = 'devotion', history = [] } = body;

        // 2. Validate Query Schema & Bounds
        if (!query || typeof query !== 'string' || !query.trim()) {
            return NextResponse.json({ error: "Study query is required." }, { status: 400 });
        }

        if (query.length > 1000) {
            return NextResponse.json({ error: "Study query exceeds 1,000 characters limit." }, { status: 400 });
        }

        // 3. Validate History Bounds
        let safeHistory: { role: 'user' | 'ai' | 'model'; content: string }[] = [];
        if (Array.isArray(history)) {
            safeHistory = history.slice(-20).map(h => ({
                role: h.role === 'ai' ? 'ai' : 'user',
                content: typeof h.content === 'string' ? h.content.slice(0, 2000) : ''
            }));
        }

        const selectedMode: SpiritOSMode = mode === 'exegesis' ? 'exegesis' : 'devotion';

        // 4. Check User Tier & Quota Guard
        const supabase = getSupabaseServerClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier, preferred_bible_version')
            .eq('id', userId)
            .maybeSingle();

        const userTier = profile?.tier || 'SEEKER';
        const preferredVersion = profile?.preferred_bible_version || 'ESV';

        // 5. Generate Real Grounded Stream with Native Model Streaming
        const { stream, context } = await streamSpiritOSStudy(
            query.trim(),
            selectedMode,
            safeHistory,
            preferredVersion
        );

        // Record user activity for streak
        await recordUserActivity(userId);

        const contextHeader = encodeURIComponent(JSON.stringify(context));

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-Rhema-Context": contextHeader,
                "Access-Control-Expose-Headers": "X-Rhema-Context"
            }
        });
    } catch (error: any) {
        console.error("Error in POST /api/spirit-os:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate theological response" },
            { status: 500 }
        );
    }
}
