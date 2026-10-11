import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
    try {
        const { userId: authUserId } = await auth();

        const body = await req.json();
        const { reference } = body;

        if (!reference) {
            return NextResponse.json({ success: false, error: "Payment reference is required" }, { status: 400 });
        }

        // Verify with Paystack API
        const verification = await verifyPaystackTransaction(reference);

        if (!verification.status || verification.data.status !== 'success') {
            return NextResponse.json({
                success: false,
                error: `Payment verification failed with status: ${verification.data?.status || 'unknown'}`
            }, { status: 400 });
        }

        const data = verification.data;
        const metadataUserId = data.metadata?.userId || data.metadata?.user_id;
        const targetUserId = authUserId || metadataUserId;

        if (!targetUserId) {
            return NextResponse.json({ success: false, error: "Unable to associate payment with user account" }, { status: 400 });
        }

        // Cross-account theft prevention
        if (authUserId && metadataUserId && metadataUserId !== authUserId) {
            return NextResponse.json({ success: false, error: "Payment was not initiated for this account" }, { status: 403 });
        }

        const supabase = getSupabaseServerClient();

        // Replay prevention: Check if reference was already redeemed by a different account
        const { data: existingRefProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('paystack_reference', reference)
            .maybeSingle();

        if (existingRefProfile && existingRefProfile.id !== targetUserId) {
            return NextResponse.json({ success: false, error: "This transaction reference has already been redeemed" }, { status: 409 });
        }

        const targetTier = (data.metadata?.tier || 'DISCIPLE').toUpperCase();
        const cycle = data.metadata?.cycle || 'monthly';
        const customerCode = data.customer?.customer_code;

        // Period end calculation
        const periodEnd = new Date();
        if (cycle === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Update profile in Supabase
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: targetUserId,
                tier: targetTier,
                paystack_customer_code: customerCode,
                paystack_reference: reference,
                subscription_status: 'active',
                current_period_end: periodEnd.toISOString(),
                updated_at: new Date().toISOString()
            });

        if (updateError) {
            console.error("Supabase profile upgrade error:", updateError);
            return NextResponse.json({
                success: false,
                error: `Database update failed: ${updateError.message}`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            tier: targetTier,
            reference,
            periodEnd: periodEnd.toISOString(),
            message: `Successfully verified and upgraded to ${targetTier}`
        });
    } catch (error: any) {
        console.error("Paystack verify route error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to verify transaction" },
            { status: 500 }
        );
    }
}
