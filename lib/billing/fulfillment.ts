import { getSupabaseServerClient } from "../supabase-server.ts";
import { getExpectedPlanPrice, type PaidTier, type BillingCycle } from "./plans.ts";

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
 * Idempotent, concurrency-safe payment fulfillment engine.
 * Serialized via PostgreSQL transaction-level advisory locks and atomic RPC execution.
 * Fails closed on any database read/write anomaly.
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

    // 2. Validate currency (Strict NGN)
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

    // 4. Validate tier and cycle against canonical server price catalog
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

    // 6. Calculate period end
    const periodEnd = new Date();
    if (planPrice.cycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const customerCode = verifiedData.customer?.customer_code;
    const supabase = getSupabaseServerClient();

    // 7. Atomic PostgreSQL RPC fulfillment with advisory locking and replay protection
    const { data: rpcResult, error: rpcError } = await supabase.rpc('fulfill_subscription_payment', {
        p_reference: reference,
        p_user_id: targetUserId,
        p_tier: planPrice.tier,
        p_billing_cycle: planPrice.cycle,
        p_amount_kobo: planPrice.amountInKobo,
        p_currency: planPrice.currency,
        p_customer_code: customerCode || null,
        p_period_end: periodEnd.toISOString(),
        p_response_json: verifiedData
    });

    if (rpcError) {
        console.error("[BILLING FULFILLMENT ERROR] Atomic RPC failed:", rpcError);
        // Fail closed on any database ledger error
        if (rpcError.message?.includes('USER_MISMATCH')) {
            return {
                success: false,
                reference,
                error: "This transaction reference was already recorded for a different user.",
                statusCode: 409
            };
        }
        return {
            success: false,
            reference,
            error: `Atomic payment fulfillment failed: ${rpcError.message}`,
            statusCode: 500
        };
    }

    if (!rpcResult || !rpcResult.success) {
        return {
            success: false,
            reference,
            error: "Fulfillment rejected by database ledger validation.",
            statusCode: 500
        };
    }

    return {
        success: true,
        tier: (rpcResult.tier || planPrice.tier) as PaidTier,
        cycle: (rpcResult.cycle || planPrice.cycle) as BillingCycle,
        periodEnd: rpcResult.period_end || periodEnd.toISOString(),
        reference,
        alreadyFulfilled: Boolean(rpcResult.already_fulfilled),
        statusCode: 200
    };
}
