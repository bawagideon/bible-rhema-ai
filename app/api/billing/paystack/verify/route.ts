import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { fulfillPaymentTransaction } from "@/lib/billing/fulfillment";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId: authUserId } = await auth();

        if (!authUserId) {
            return NextResponse.json({
                success: false,
                error: "Authentication required to verify payment"
            }, { status: 401 });
        }

        const body = await req.json();
        const { reference } = body;

        if (!reference || typeof reference !== 'string') {
            return NextResponse.json({
                success: false,
                error: "Payment reference is required"
            }, { status: 400 });
        }

        // 1. Verify with Paystack API
        const verification = await verifyPaystackTransaction(reference);

        if (!verification.status || !verification.data) {
            return NextResponse.json({
                success: false,
                error: "Transaction verification failed with Paystack provider"
            }, { status: 400 });
        }

        // 2. Perform idempotent, strictly validated fulfillment
        const result = await fulfillPaymentTransaction({
            reference,
            verifiedData: verification.data,
            expectedUserId: authUserId
        });

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || "Payment verification failed"
            }, { status: result.statusCode });
        }

        return NextResponse.json({
            success: true,
            tier: result.tier,
            cycle: result.cycle,
            reference: result.reference,
            periodEnd: result.periodEnd,
            alreadyFulfilled: result.alreadyFulfilled || false,
            message: result.alreadyFulfilled
                ? `Transaction already fulfilled for ${result.tier}`
                : `Successfully upgraded to ${result.tier}`
        });

    } catch (error: any) {
        console.error("Paystack verification endpoint error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal server error verifying transaction"
        }, { status: 500 });
    }
}
