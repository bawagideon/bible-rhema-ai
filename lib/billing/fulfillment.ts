import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getExpectedPlanPrice, PaidTier, BillingCycle } from "@/lib/billing/plans";

export interface FulfillPaymentParams {
    reference: string;
    verifiedData: {
        status: string;
        amount: number; // in kobo
        currency: string;
        customer?: {
            customer_code?: string;
            email?: string;
        };
        metadata?: {
            userId?: string;
            user_id?: string;
            tier?: string;
            cycle?: string;
            [key: string]: any;
        };
    };
    expectedUserId?: string; // If called from authenticated route
}

export interface FulfillmentResult {
    success: boolean;
    tier?: PaidTier;
    cycle?: BillingCycle;
    periodEnd?: string;
    reference: string;
    alreadyFulfilled?: boolean;
    error?: string;
    statusCode: number;
}

/**
 * Idempotent, server-validated payment fulfillment helper.
 * Used by both POST /api/billing/paystack/verify and POST /api/webhooks/paystack.
 */
export async function fulfillPaymentTransaction(
    params: FulfillPaymentParams
): Promise<FulfillmentResult> {
    const { reference, verifiedData, expectedUserId } = params;

    if (!reference || typeof reference !== 'string') {
        return { success: false, reference: reference || '', error: "Invalid payment reference", statusCode: 400 };
    }

    // 1. Validate status
    if (verifiedData.status !== 'success') {
        return {
            success: false,
            reference,
            error: `Payment was not successful. Paystack status: ${verifiedData.status}`,
            statusCode: 400
        };
    }

    // 2. Validate currency
    if (verifiedData.currency !== 'NGN') {
        return {
            success: false,
            reference,
            error: `Invalid transaction currency: ${verifiedData.currency}. Expected NGN.`,
            statusCode: 400
        };
    }

    // 3. Resolve target user ID
    const metadataUserId = verifiedData.metadata?.userId || verifiedData.metadata?.user_id;
    const targetUserId = expectedUserId || metadataUserId;

    if (!targetUserId) {
        return {
            success: false,
            reference,
            error: "Unable to bind payment to a user ID. Missing metadata.",
            statusCode: 400
        };
    }

    // If caller is authenticated, verify metadata user matches authenticated user
    if (expectedUserId && metadataUserId && metadataUserId !== expectedUserId) {
        return {
            success: false,
            reference,
            error: "Cross-account payment binding forbidden: payment was initiated by a different user.",
            statusCode: 403
        };
    }

    // 4. Validate tier and cycle against server price catalog
    const rawTier = (verifiedData.metadata?.tier || '').toUpperCase();
    const rawCycle = (verifiedData.metadata?.cycle || 'monthly').toLowerCase();

    const planPrice = getExpectedPlanPrice(rawTier, rawCycle);
    if (!planPrice) {
        return {
            success: false,
            reference,
            error: `Invalid tier '${rawTier}' or cycle '${rawCycle}' specified in payment metadata.`,
            statusCode: 400
        };
    }

    // 5. Strict amount validation: Paystack paid amount MUST match exact plan price
    if (verifiedData.amount !== planPrice.amountInKobo) {
        return {
            success: false,
            reference,
            error: `Payment underpayment/overpayment detected. Paid ${verifiedData.amount} kobo, expected ${planPrice.amountInKobo} kobo for ${planPrice.label}.`,
            statusCode: 400
        };
    }

    const supabase = getSupabaseServerClient();

    // 6. Check existing transaction in payment_transactions table (Replay Protection)
    const { data: existingTx, error: txCheckErr } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference', reference)
        .maybeSingle();

    if (txCheckErr && txCheckErr.code !== 'PGRST116') {
        console.warn("Could not query payment_transactions table (table may not exist yet, checking profiles fallback):", txCheckErr);
    }

    if (existingTx) {
        // If already fulfilled, return idempotent success without pushing period end again!
        if (existingTx.status === 'fulfilled') {
            return {
                success: true,
                tier: existingTx.plan as PaidTier,
                cycle: existingTx.cycle as BillingCycle,
                reference,
                alreadyFulfilled: true,
                statusCode: 200
            };
        }

        // If reference belongs to a different user, reject!
        if (existingTx.user_id !== targetUserId) {
            return {
                success: false,
                reference,
                error: "This transaction reference was already recorded for another user.",
                statusCode: 409
            };
        }
    }

    // Fallback check on profiles table if payment_transactions has no row
    const { data: existingProfileRef } = await supabase
        .from('profiles')
        .select('id, paystack_reference, current_period_end')
        .eq('paystack_reference', reference)
        .maybeSingle();

    if (existingProfileRef && existingProfileRef.id !== targetUserId) {
        return {
            success: false,
            reference,
            error: "This transaction reference has already been redeemed by another account.",
            statusCode: 409
        };
    }

    // 7. Calculate period end
    const periodEnd = new Date();
    if (planPrice.cycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const customerCode = verifiedData.customer?.customer_code;

    // 8. Record transaction in payment_transactions
    try {
        await supabase
            .from('payment_transactions')
            .upsert({
                reference,
                user_id: targetUserId,
                amount_kobo: planPrice.amountInKobo,
                currency: planPrice.currency,
                plan: planPrice.tier,
                cycle: planPrice.cycle,
                status: 'fulfilled',
                fulfilled_at: new Date().toISOString(),
                paystack_response_json: verifiedData
            }, { onConflict: 'reference' });
    } catch (e) {
        console.warn("Could not insert into payment_transactions (will proceed with profile update):", e);
    }

    // 9. Update user profile
    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .upsert({
            id: targetUserId,
            tier: planPrice.tier,
            paystack_customer_code: customerCode || null,
            paystack_reference: reference,
            subscription_status: 'active',
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString()
        });

    if (profileUpdateError) {
        console.error("Profile update error during fulfillment:", profileUpdateError);
        return {
            success: false,
            reference,
            error: `Failed to update profile entitlement: ${profileUpdateError.message}`,
            statusCode: 500
        };
    }

    return {
        success: true,
        tier: planPrice.tier,
        cycle: planPrice.cycle,
        periodEnd: periodEnd.toISOString(),
        reference,
        alreadyFulfilled: false,
        statusCode: 200
    };
}
