import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaystackSignature } from "@/lib/paystack";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-paystack-signature") || "";

        // Verify cryptographic signature
        if (!verifyPaystackSignature(rawBody, signature)) {
            console.warn("Invalid Paystack webhook signature received");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const event = payload.event;
        const data = payload.data;

        console.log(`[PAYSTACK WEBHOOK] Event received: ${event}`);

        const supabase = getSupabaseServerClient();

        switch (event) {
            case "charge.success": {
                const userId = data.metadata?.userId || data.metadata?.user_id;
                const tier = (data.metadata?.tier || "DISCIPLE").toUpperCase();
                const cycle = data.metadata?.cycle || "monthly";
                const customerCode = data.customer?.customer_code;
                const reference = data.reference;

                if (!userId) {
                    console.warn("[PAYSTACK WEBHOOK] charge.success missing userId in metadata");
                    break;
                }

                const periodEnd = new Date();
                if (cycle === 'yearly') {
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                } else {
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                }

                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        tier: tier,
                        paystack_customer_code: customerCode,
                        paystack_reference: reference,
                        subscription_status: 'active',
                        current_period_end: periodEnd.toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error("[PAYSTACK WEBHOOK] Failed to update profile:", error);
                } else {
                    console.log(`[PAYSTACK WEBHOOK] Successfully upgraded user ${userId} to ${tier}`);
                }
                break;
            }

            case "subscription.create": {
                const customerCode = data.customer?.customer_code;
                const subCode = data.subscription_code;
                const planCode = data.plan?.plan_code;

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
                const subCode = data.subscription_code;
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
