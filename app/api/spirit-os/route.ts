import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateSpiritOSResponse, SpiritOSMode } from "@/lib/ai/gemini";

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

        // Call the AI engine
        const answer = await generateSpiritOSResponse(query, selectedMode, history);

        // Return streaming text response compatible with fetch reader
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                // Chunk the answer for smooth client-side reading experience
                const chunkSize = 24;
                for (let i = 0; i < answer.length; i += chunkSize) {
                    controller.enqueue(encoder.encode(answer.slice(i, i + chunkSize)));
                    // Small micro-delay to simulate natural streaming
                    await new Promise(resolve => setTimeout(resolve, 15));
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
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
