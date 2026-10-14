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

        // 6. Enforce Seeker Tier Daily Quota Atomically (Max 10 studies/day) - Fail Closed
        let quotaReserved = false;
        let reservationId: string | null = null;
        if (userTier === 'SEEKER') {
            const { data: quotaResult, error: quotaErr } = await supabase.rpc('reserve_query_quota', {
                p_user_id: userId,
                p_limit: 10
            });

            if (quotaErr || !quotaResult || typeof quotaResult !== 'object') {
                console.error("[SPIRITOS QUOTA ERROR] Failed to reserve quota slot:", quotaErr);
                return NextResponse.json({
                    error: "Unable to verify daily study quota. Please try again in a few moments."
                }, { status: 500 });
            }

            if (quotaResult.allowed === false) {
                return NextResponse.json({
                    error: "Daily study limit reached (10 queries/day on Seeker tier). Upgrade your plan to Disciple for unlimited SpiritOS studies.",
                    limitExceeded: true,
                    currentCount: quotaResult.count,
                    tier: userTier
                }, { status: 429 });
            }

            // Strictly require allowed === true; reject any unexpected or malformed payload
            if (quotaResult.allowed !== true) {
                console.error("[SPIRITOS QUOTA ERROR] Malformed quota response:", quotaResult);
                return NextResponse.json({
                    error: "Unable to confirm study quota. Please try again."
                }, { status: 500 });
            }

            quotaReserved = true;
            reservationId = quotaResult.reservation_id || null;
        }

        // 7. Generate Real Grounded Stream with Native Model Streaming
        let streamResult;
        try {
            streamResult = await streamSpiritOSStudy(
                query.trim(),
                selectedMode,
                safeHistory,
                preferredVersion
            );
        } catch (genError) {
            // Refund reserved quota if generation failed before delivering stream
            if (quotaReserved) {
                try {
                    await supabase.rpc('refund_query_quota', {
                        p_user_id: userId,
                        p_reservation_id: reservationId
                    });
                } catch {
                    // Suppress cleanup error
                }
            }
            throw genError;
        }

        const { stream, context } = streamResult;

        // 8. Wrap stream in TransformStream to record streak activity strictly on successful completion
        const activityTransformStream = new TransformStream({
            transform(chunk, controller) {
                controller.enqueue(chunk);
            },
            async flush() {
                try {
                    await recordUserActivity(userId);
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
