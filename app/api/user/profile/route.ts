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
                struggles: profile.struggles || [],
                favorite_ministers: profile.favorite_ministers || [],
                preferred_bible_version: profile.preferred_bible_version || 'ESV',
                has_completed_onboarding: profile.has_completed_onboarding ?? false
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
                avatar_url: avatarUrl,
                spiritual_goals: [],
                struggles: [],
                favorite_ministers: [],
                preferred_bible_version: 'ESV',
                has_completed_onboarding: false
            }, { onConflict: 'id', ignoreDuplicates: true });

        return NextResponse.json({
            authenticated: true,
            id: userId,
            tier: 'SEEKER',
            full_name: fullName,
            avatar_url: avatarUrl,
            email: email,
            spiritual_goals: [],
            struggles: [],
            favorite_ministers: [],
            preferred_bible_version: 'ESV',
            has_completed_onboarding: false
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

        // STRICT ALLOWLIST: Protect tier, subscription status, and user ID from manipulation
        const safeUpdates: Record<string, any> = {
            id: userId,
            updated_at: new Date().toISOString()
        };

        if (typeof body.full_name === 'string') safeUpdates.full_name = body.full_name.trim();
        if (Array.isArray(body.spiritual_goals)) safeUpdates.spiritual_goals = body.spiritual_goals;
        if (Array.isArray(body.struggles)) safeUpdates.struggles = body.struggles;
        if (Array.isArray(body.favorite_ministers)) safeUpdates.favorite_ministers = body.favorite_ministers;
        if (typeof body.preferred_bible_version === 'string') safeUpdates.preferred_bible_version = body.preferred_bible_version;
        if (typeof body.has_completed_onboarding === 'boolean') safeUpdates.has_completed_onboarding = body.has_completed_onboarding;

        const { data, error } = await supabase
            .from('profiles')
            .upsert(safeUpdates)
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
