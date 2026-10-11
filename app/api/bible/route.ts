import { NextRequest, NextResponse } from "next/server";
import { resolveScripturePassage } from "@/lib/bible/api-bible";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ref = searchParams.get('ref') || searchParams.get('query');
        const version = searchParams.get('version') || 'WEB';

        if (!ref) {
            return NextResponse.json({ success: false, error: "Scripture reference parameter 'ref' is required" }, { status: 400 });
        }

        const passage = await resolveScripturePassage(ref, version);

        if (!passage) {
            return NextResponse.json({
                success: false,
                error: `Could not resolve passage for '${ref}'. Check reference syntax.`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: passage
        });
    } catch (error: any) {
        console.error("Error in /api/bible:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
