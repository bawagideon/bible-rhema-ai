import { NextRequest, NextResponse } from "next/server";
import { generateStudioAssist } from "@/lib/ai/gemini";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
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
