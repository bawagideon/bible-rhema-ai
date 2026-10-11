import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { initializePaystackTransaction } from "@/lib/paystack";

export const dynamic = 'force-dynamic';

// Pricing configuration in NGN (Nigerian Naira) - Kobo (1 NGN = 100 kobo)
// Also supports USD if configured
const TIER_PRICING: Record<string, { monthly: number; yearly: number }> = {
    DISCIPLE: {
        monthly: 500000,   // ₦5,000 / month
        yearly: 5000000    // ₦50,000 / year (save ~17%)
    },
    MINISTER: {
        monthly: 1500000,  // ₦15,000 / month
        yearly: 15000000   // ₦150,000 / year (save ~17%)
    }
};

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized. Please sign in to upgrade." }, { status: 401 });
        }

        const body = await req.json();
        const { tier = 'DISCIPLE', cycle = 'monthly' } = body;

        const targetTier = (tier as string).toUpperCase();
        if (!['DISCIPLE', 'MINISTER'].includes(targetTier)) {
            return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
        }

        const selectedCycle = cycle === 'yearly' ? 'yearly' : 'monthly';
        const pricing = TIER_PRICING[targetTier];
        const amountInKobo = pricing[selectedCycle];

        const userEmail = user?.emailAddresses?.[0]?.emailAddress || `${userId}@bible-rhema.com`;

        // Get origin for callback
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
        const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
        const origin = `${proto}://${host}`;
        const callbackUrl = `${origin}/pricing?status=verifying`;

        const initResult = await initializePaystackTransaction({
            email: userEmail,
            amountInKobo,
            callbackUrl,
            metadata: {
                userId,
                tier: targetTier as 'DISCIPLE' | 'MINISTER',
                cycle: selectedCycle,
                userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
            }
        });

        return NextResponse.json({
            success: true,
            authorizationUrl: initResult.data.authorization_url,
            accessCode: initResult.data.access_code,
            reference: initResult.data.reference
        });
    } catch (error: any) {
        console.error("Paystack initialize error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to initialize payment transaction" },
            { status: 500 }
        );
    }
}
