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
                    return NextResponse.json(
                        { error: fulfillment.error || "Fulfillment could not be completed" },
                        { status: fulfillment.statusCode || 500 }
                    );
                }

                console.log(`[PAYSTACK WEBHOOK] Fulfillment succeeded for ${fulfillment.reference} (${fulfillment.tier})`);
                break;
            }

            case "subscription.create": {
                const customerCode = data?.customer?.customer_code;
                const subCode = data?.subscription_code;
                const planCode = data?.plan?.plan_code;

                if (customerCode && subCode) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            paystack_subscription_code: subCode,
                            paystack_plan_code: planCode,
                            subscription_status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('paystack_customer_code', customerCode);

                    if (error) {
                        console.error("[PAYSTACK WEBHOOK] subscription.create error:", error);
                        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                    }
                }
                break;
            }

            case "subscription.not_renew": {
                // Customer cancelled auto-renewal: keep active tier until current_period_end expires!
                const subCode = data?.subscription_code;
                if (subCode) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            subscription_status: 'cancelled',
                            updated_at: new Date().toISOString()
                        })
                        .eq('paystack_subscription_code', subCode);

                    if (error) {
                        console.error("[PAYSTACK WEBHOOK] subscription.not_renew error:", error);
                        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                    }
                    console.log(`[PAYSTACK WEBHOOK] Auto-renewal disabled for sub ${subCode}. User retains access through paid period.`);
                }
                break;
            }

            case "subscription.disable": {
                const subCode = data?.subscription_code;
                if (subCode) {
                    // Check if current paid period has already elapsed
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('current_period_end')
                        .eq('paystack_subscription_code', subCode)
                        .single();

                    const isExpired = !profile?.current_period_end || new Date(profile.current_period_end).getTime() <= Date.now();
                    const updates: Record<string, any> = {
                        subscription_status: 'cancelled',
                        updated_at: new Date().toISOString()
                    };
                    if (isExpired) {
                        updates.tier = 'SEEKER';
                    }

                    const { error } = await supabase
                        .from('profiles')
                        .update(updates)
                        .eq('paystack_subscription_code', subCode);

                    if (error) {
                        console.error("[PAYSTACK WEBHOOK] subscription.disable error:", error);
                        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const customerCode = data?.customer?.customer_code;
                const subCode = data?.subscription?.subscription_code || data?.subscription_code;
                if (subCode || customerCode) {
                    const updates = {
                        subscription_status: 'past_due',
                        updated_at: new Date().toISOString()
                    };
                    let query = supabase.from('profiles').update(updates);
                    if (subCode) {
                        query = query.eq('paystack_subscription_code', subCode);
                    } else if (customerCode) {
                        query = query.eq('paystack_customer_code', customerCode);
                    }
                    const { error } = await query;
                    if (error) {
                        console.error("[PAYSTACK WEBHOOK] invoice.payment_failed error:", error);
                        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                    }
                    console.log(`[PAYSTACK WEBHOOK] Invoice payment failed for sub ${subCode || customerCode}; status set to past_due.`);
                }
                break;
            }

            case "refund.processed": {
                const refundAmount = Number(data?.amount || 0);
                const txRef = data?.transaction_reference || data?.reference;
                const customerCode = data?.customer?.customer_code;

                if (txRef) {
                    // Reconcile against specific payment transaction
                    const { data: origTx, error: txErr } = await supabase
                        .from('payment_transactions')
                        .select('*')
                        .eq('reference', txRef)
                        .maybeSingle();

                    if (!txErr && origTx) {
                        const origAmount = Number(origTx.amount_kobo || 0);
                        const isFullRefund = origAmount <= 0 || refundAmount >= origAmount;

                        if (isFullRefund) {
                            // Full refund of subscription fee -> Revoke entitlement immediately
                            await supabase
                                .from('payment_transactions')
                                .update({ status: 'refunded', updated_at: new Date().toISOString() })
                                .eq('id', origTx.id);

                            if (origTx.user_id) {
                                const { error: profErr } = await supabase
                                    .from('profiles')
                                    .update({
                                        tier: 'SEEKER',
                                        subscription_status: 'refunded',
                                        current_period_end: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', origTx.user_id);

                                if (profErr) {
                                    console.error("[PAYSTACK WEBHOOK] refund.processed profile error:", profErr);
                                    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                                }
                            }
                            console.log(`[PAYSTACK WEBHOOK] Full refund (${refundAmount} kobo) processed for ref ${txRef}. Tier revoked.`);
                        } else {
                            // Partial refund -> Retain active subscription, record partial refund note
                            await supabase
                                .from('payment_transactions')
                                .update({
                                    updated_at: new Date().toISOString(),
                                    notes: `Partial refund processed: ${refundAmount} kobo of ${origAmount} kobo`
                                })
                                .eq('id', origTx.id);
                            console.log(`[PAYSTACK WEBHOOK] Partial refund (${refundAmount} kobo) processed for ref ${txRef}. Active tier retained.`);
                        }
                        break;
                    }
                }

                if (customerCode) {
                    console.log(`[PAYSTACK WEBHOOK] refund.processed for customer ${customerCode} without transaction match; logged.`);
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
