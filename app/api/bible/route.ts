import { NextRequest, NextResponse } from "next/server";
import { resolveScripturePassage } from "@/lib/bible/api-bible";
import { scriptureRateLimiter } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        const parts = forwarded.split(",");
        if (parts[0] && parts[0].trim()) {
            return parts[0].trim();
        }
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp && realIp.trim()) {
        return realIp.trim();
    }
    return "127.0.0.1";
}

export async function GET(req: NextRequest) {
    try {
        const clientIp = getClientIp(req);
        if (scriptureRateLimiter.isRateLimited(clientIp)) {
            return NextResponse.json({
                success: false,
                error: "Rate limit exceeded. Maximum 60 scripture resolution requests per minute permitted."
            }, {
                status: 429,
                headers: { 'Retry-After': '60' }
            });
        }

        const { searchParams } = new URL(req.url);
        const ref = searchParams.get('ref') || searchParams.get('query');
        const version = searchParams.get('version') || 'WEB';

        if (!ref || typeof ref !== 'string') {
            return NextResponse.json({ success: false, error: "Scripture reference parameter 'ref' is required." }, { status: 400 });
        }

        const cleanRef = ref.trim();
        if (cleanRef.length === 0) {
            return NextResponse.json({ success: false, error: "Scripture reference cannot be empty." }, { status: 400 });
        }

        if (cleanRef.length > 100) {
            return NextResponse.json({ success: false, error: "Scripture reference exceeds maximum permitted length of 100 characters." }, { status: 400 });
        }

        const cleanVersion = (typeof version === 'string' ? version.trim().slice(0, 20) : 'WEB') || 'WEB';

        const passage = await resolveScripturePassage(cleanRef, cleanVersion, { timeoutMs: 6000 });

        if (!passage) {
            return NextResponse.json({
                success: false,
                error: `Could not resolve passage for '${cleanRef}'. Check book name and chapter:verse bounds.`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: passage
        });
    } catch (error: any) {
        console.error("Error in /api/bible:", error);
        return NextResponse.json({
            success: false,
            error: "An unexpected error occurred while resolving scripture citation."
        }, { status: 500 });
    }
}
