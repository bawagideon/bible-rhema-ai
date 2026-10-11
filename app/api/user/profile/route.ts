import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                authenticated: false,
                tier: 'SEEKER',
                full_name: 'Believer'
            });
        }

        const user = await currentUser();
        const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Believer';
        const email = user?.emailAddresses?.[0]?.emailAddress || '';
        const avatarUrl = user?.imageUrl || '';

        const supabase = getSupabaseServerClient();

        // 1. Fetch existing profile from Supabase
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile) {
            return NextResponse.json({
                authenticated: true,
                id: userId,
                tier: profile.tier || 'SEEKER',
                full_name: profile.full_name || fullName,
                avatar_url: profile.avatar_url || avatarUrl,
                email: profile.email || email,
                spiritual_goals: profile.spiritual_goals || [],
                preferred_bible_version: profile.preferred_bible_version || 'ESV'
            });
        }

        // 2. If profile doesn't exist yet, auto-provision as SEEKER
        await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                tier: 'SEEKER',
                avatar_url: avatarUrl
            }, { onConflict: 'id', ignoreDuplicates: true });

        return NextResponse.json({
            authenticated: true,
            id: userId,
            tier: 'SEEKER',
            full_name: fullName,
            avatar_url: avatarUrl,
            email: email,
            preferred_bible_version: 'ESV'
        });

    } catch (error: any) {
        console.error("Error in GET /api/user/profile:", error);
        return NextResponse.json({
            authenticated: true,
            tier: 'SEEKER',
            full_name: 'Believer'
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const supabase = getSupabaseServerClient();

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...body,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("Profile update error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: data });
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
