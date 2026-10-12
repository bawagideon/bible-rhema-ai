import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getExpectedPlanPrice } from "@/lib/billing/plans";

export const dynamic = 'force-dynamic';

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
        const selectedCycle = cycle === 'yearly' ? 'yearly' : 'monthly';

        // Authoritative server price verification
        const planPrice = getExpectedPlanPrice(targetTier, selectedCycle);
        if (!planPrice) {
            return NextResponse.json({ error: "Invalid subscription tier or billing cycle" }, { status: 400 });
        }

        const userEmail = user?.emailAddresses?.[0]?.emailAddress || `${userId}@bible-rhema.com`;

        // Determine canonical callback URL
        const canonicalBase = process.env.NEXT_PUBLIC_APP_URL;
        let origin = canonicalBase;
        if (!origin) {
            const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
            const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
            origin = `${proto}://${host}`;
        }
        const callbackUrl = `${origin}/pricing?status=verifying`;

        const initResult = await initializePaystackTransaction({
            email: userEmail,
            amountInKobo: planPrice.amountInKobo,
            callbackUrl,
            metadata: {
                userId,
                tier: planPrice.tier,
                cycle: planPrice.cycle,
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
