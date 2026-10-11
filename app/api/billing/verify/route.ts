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
    // SECURITY: Disabled to prevent unverified tier privilege escalation.
    // All subscription activations must be verified through Paystack via /api/billing/paystack/verify or webhooks.
    return NextResponse.json({
        success: false,
        error: "Legacy unverified billing endpoint is deprecated and disabled for security. Use verified payment gateways."
    }, { status: 410 });
}
