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

        // 2. Enforce 50KB Payload Bound (HTTP 413)
        const contentLength = req.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 50000) {
            return NextResponse.json({
                error: "Payload exceeds 50KB limit. Please reduce your query length or study history."
            }, { status: 413 });
        }

        const rawBodyText = await req.text();
        if (rawBodyText.length > 50000) {
            return NextResponse.json({
                error: "Payload exceeds 50KB limit."
            }, { status: 413 });
        }

        let body: any;
        try {
            body = JSON.parse(rawBodyText);
        } catch {
            return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
        }

        const { query, mode = 'devotion', history = [] } = body;

        // 3. Validate Query Schema & Bounds
        if (!query || typeof query !== 'string' || !query.trim()) {
            return NextResponse.json({ error: "Study query is required." }, { status: 400 });
        }

        if (query.length > 1000) {
            return NextResponse.json({ error: "Study query exceeds 1,000 characters limit." }, { status: 400 });
        }

        // 4. Validate History Bounds
        let safeHistory: { role: 'user' | 'ai' | 'model'; content: string }[] = [];
        if (Array.isArray(history)) {
            safeHistory = history.slice(-20).map(h => ({
                role: h.role === 'ai' ? 'ai' : 'user',
                content: typeof h.content === 'string' ? h.content.slice(0, 2000) : ''
            }));
        }

        const selectedMode: SpiritOSMode = mode === 'exegesis' ? 'exegesis' : 'devotion';

        // 5. Check User Tier & Quota Guard
        const supabase = getSupabaseServerClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier, preferred_bible_version')
            .eq('id', userId)
            .maybeSingle();

        const userTier = profile?.tier || 'SEEKER';
        const preferredVersion = profile?.preferred_bible_version || 'ESV';

        // 6. Enforce Seeker Tier Daily Quota (Max 10 studies/day)
        if (userTier === 'SEEKER') {
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: usageData, error: usageErr } = await supabase
                .from('user_daily_usage')
                .select('query_count')
                .eq('user_id', userId)
                .eq('usage_date', todayStr)
                .maybeSingle();

            if (!usageErr && usageData && (usageData.query_count >= 10)) {
                return NextResponse.json({
                    error: "Daily study limit reached (10 queries/day on Seeker tier). Upgrade your plan to Disciple for unlimited SpiritOS studies.",
                    limitExceeded: true,
                    currentCount: usageData.query_count,
                    tier: userTier
                }, { status: 429 });
            }
        }

        // 7. Generate Real Grounded Stream with Native Model Streaming
        const { stream, context } = await streamSpiritOSStudy(
            query.trim(),
            selectedMode,
            safeHistory,
            preferredVersion
        );

        // 8. Wrap stream in TransformStream to record activity & usage strictly on successful completion
        const todayStr = new Date().toISOString().split('T')[0];
        const activityTransformStream = new TransformStream({
            transform(chunk, controller) {
                controller.enqueue(chunk);
            },
            async flush() {
                try {
                    await Promise.allSettled([
                        recordUserActivity(userId),
                        supabase.rpc('increment_query_usage', { p_user_id: userId }),
                        supabase
                            .from('user_daily_usage')
                            .upsert(
                                { user_id: userId, usage_date: todayStr, query_count: 1 },
                                { onConflict: 'user_id,usage_date' }
                            )
                    ]);
                } catch (e) {
                    console.error("Failed to record activity on stream completion:", e);
                }
            }
        });

        const pipedStream = stream.pipeThrough(activityTransformStream);
        const contextHeader = encodeURIComponent(JSON.stringify(context));

        return new Response(pipedStream, {
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
