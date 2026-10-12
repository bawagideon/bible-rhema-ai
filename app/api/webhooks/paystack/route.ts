import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyPaystackSignature } from "@/lib/paystack";
import { fulfillPaymentTransaction } from "@/lib/billing/fulfillment";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-paystack-signature") || "";

        // 1. Verify cryptographic HMAC SHA512 signature
        if (!verifyPaystackSignature(rawBody, signature)) {
            console.warn("Invalid Paystack webhook signature received");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const event = payload.event;
        const data = payload.data;

        console.log(`[PAYSTACK WEBHOOK] Verified event received: ${event}`);

        const supabase = getSupabaseServerClient();

        switch (event) {
            case "charge.success": {
                if (!data || !data.reference) {
                    console.warn("[PAYSTACK WEBHOOK] charge.success missing reference");
                    break;
                }

                // Unified idempotent fulfillment with strict amount & currency validation
                const fulfillment = await fulfillPaymentTransaction({
                    reference: data.reference,
                    verifiedData: data
                });

                if (!fulfillment.success) {
                    console.error("[PAYSTACK WEBHOOK] Fulfillment failed:", fulfillment.error);
                } else {
                    console.log(`[PAYSTACK WEBHOOK] Fulfillment succeeded for ${fulfillment.reference} (${fulfillment.tier})`);
                }
                break;
            }

            case "subscription.create": {
                const customerCode = data?.customer?.customer_code;
                const subCode = data?.subscription_code;
                const planCode = data?.plan?.plan_code;

                if (customerCode && subCode) {
                    await supabase
                        .from('profiles')
                        .update({
                            paystack_subscription_code: subCode,
                            paystack_plan_code: planCode,
                            subscription_status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('paystack_customer_code', customerCode);
                }
                break;
            }

            case "subscription.disable":
            case "subscription.not_renew": {
                const subCode = data?.subscription_code;
                if (subCode) {
                    await supabase
                        .from('profiles')
                        .update({
                            tier: 'SEEKER',
                            subscription_status: 'cancelled',
                            updated_at: new Date().toISOString()
                        })
                        .eq('paystack_subscription_code', subCode);
                }
                break;
            }

            default:
                console.log(`[PAYSTACK WEBHOOK] Unhandled event: ${event}`);
                break;
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error("Paystack webhook processing error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
