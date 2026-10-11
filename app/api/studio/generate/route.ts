import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateSermonAI } from "@/lib/ai/gemini";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

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
