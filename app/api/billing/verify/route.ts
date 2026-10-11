import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { tier, subscriptionId, cycle = 'monthly', provider = 'paypal' } = body;

        const validTiers = ['DISCIPLE', 'MINISTER', 'SEEKER'];
        const targetTier = (tier || 'DISCIPLE').toUpperCase();

        if (!validTiers.includes(targetTier)) {
            return NextResponse.json({ success: false, error: "Invalid subscription tier" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Calculate period end
        const periodEnd = new Date();
        if (cycle === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Try calling the SQL definer function or update directly
        const { error: rpcError } = await supabase.rpc('update_subscription_status', {
            p_user_id: userId,
            p_tier: targetTier,
            p_sub_id: subscriptionId || `sub_${Date.now()}`,
            p_status: 'active',
            p_period_end: periodEnd.toISOString()
        });

        if (rpcError) {
            console.warn("RPC update_subscription_status note, falling back to direct update:", rpcError);
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    tier: targetTier,
                    paypal_subscription_id: subscriptionId || `sub_${Date.now()}`,
                    subscription_status: 'active',
                    current_period_end: periodEnd.toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (updateError) {
                console.error("Direct profile tier update error:", updateError);
            }
        }

        return NextResponse.json({
            success: true,
            tier: targetTier,
            subscription_status: 'active',
            current_period_end: periodEnd.toISOString()
        });
    } catch (error: any) {
        console.error("Error in /api/billing/verify:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
