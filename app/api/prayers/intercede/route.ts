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
            return NextResponse.json({ success: false, error: "Please sign in to join in prayer." }, { status: 401 });
        }

        const body = await req.json();
        const { prayerId } = body;

        if (!prayerId) {
            return NextResponse.json({ success: false, error: "Prayer ID is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // 1. Fetch current prayer
        const { data: prayer, error: fetchErr } = await supabase
            .from('prayers')
            .select('id, prayed_count, intercessors')
            .eq('id', prayerId)
            .single();

        if (fetchErr || !prayer) {
            return NextResponse.json({ success: false, error: "Prayer not found" }, { status: 404 });
        }

        const intercessors: string[] = Array.isArray(prayer.intercessors) ? prayer.intercessors : [];
        const alreadyPrayed = intercessors.includes(userId);

        let newIntercessors = intercessors;
        let newCount = prayer.prayed_count || 0;

        if (!alreadyPrayed) {
            newIntercessors = [...intercessors, userId];
            newCount += 1;
        } else {
            // Un-pray or simply acknowledge
            return NextResponse.json({
                success: true,
                message: "You have already joined in prayer for this request.",
                prayedCount: newCount,
                alreadyPrayed: true
            });
        }

        // 2. Update record
        const { error: updateErr } = await supabase
            .from('prayers')
            .update({
                prayed_count: newCount,
                intercessors: newIntercessors
            })
            .eq('id', prayerId);

        if (updateErr) {
            return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Amen! Your prayer was recorded.",
            prayedCount: newCount,
            alreadyPrayed: false
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
