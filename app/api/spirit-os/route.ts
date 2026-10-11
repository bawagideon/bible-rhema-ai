import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateSpiritOSStudy, SpiritOSMode } from "@/lib/ai/gemini";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        const body = await req.json();
        const { query, mode = 'devotion', history = [] } = body;

        if (!query || typeof query !== 'string' || !query.trim()) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const selectedMode: SpiritOSMode = mode === 'exegesis' ? 'exegesis' : 'devotion';

        // Call the AI study engine to get content and Living Context
        const study = await generateSpiritOSStudy(query, selectedMode, history);
        const answer = study.content;

        // Context header for Living Context Panel
        const contextHeader = encodeURIComponent(JSON.stringify(study.context));

        // Return streaming text response compatible with fetch reader
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const chunkSize = 24;
                for (let i = 0; i < answer.length; i += chunkSize) {
                    controller.enqueue(encoder.encode(answer.slice(i, i + chunkSize)));
                    await new Promise(resolve => setTimeout(resolve, 15));
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-Rhema-Context": contextHeader,
                "Access-Control-Expose-Headers": "X-Rhema-Context"
            }
        });
    } catch (error: any) {
        console.error("Error in /api/spirit-os:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate theological response" },
            { status: 500 }
        );
    }
}
