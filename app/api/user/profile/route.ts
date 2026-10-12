import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                authenticated: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const user = await currentUser();
        const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Believer';
        const email = user?.emailAddresses?.[0]?.emailAddress || '';
        const avatarUrl = user?.imageUrl || '';

        const supabase = getSupabaseServerClient();

        // 1. Fetch existing profile from Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error("Supabase profile fetch error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

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
                has_completed_onboarding: profile.has_completed_onboarding ?? false,
                current_period_end: profile.current_period_end || null,
                subscription_status: profile.subscription_status || 'active'
            });
        }

        // 2. If profile doesn't exist yet, auto-provision as SEEKER
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                avatar_url: avatarUrl,
                tier: 'SEEKER',
                subscription_status: 'active',
                has_completed_onboarding: false,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error auto-provisioning profile:", insertError);
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            authenticated: true,
            id: userId,
            tier: 'SEEKER',
            full_name: newProfile?.full_name || fullName,
            avatar_url: newProfile?.avatar_url || avatarUrl,
            email: newProfile?.email || email,
            spiritual_goals: [],
            struggles: [],
            favorite_ministers: [],
            preferred_bible_version: 'ESV',
            has_completed_onboarding: false,
            current_period_end: null,
            subscription_status: 'active'
        });

    } catch (error: any) {
        console.error("Error in GET /api/user/profile:", error);
        return NextResponse.json({
            authenticated: false,
            error: error.message || "Failed to load user profile"
        }, { status: 500 });
    }
}

async function handleProfileUpdate(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const supabase = getSupabaseServerClient();

        // STRICT ALLOWLIST: Protect tier, subscription status, and user ID from client tampering
        const safeUpdates: Record<string, any> = {
            id: userId,
            updated_at: new Date().toISOString()
        };

        if (typeof body.full_name === 'string') safeUpdates.full_name = body.full_name.trim().slice(0, 100);
        if (Array.isArray(body.spiritual_goals)) safeUpdates.spiritual_goals = body.spiritual_goals.slice(0, 20);
        if (Array.isArray(body.struggles)) safeUpdates.struggles = body.struggles.slice(0, 20);
        if (Array.isArray(body.favorite_ministers)) safeUpdates.favorite_ministers = body.favorite_ministers.slice(0, 20);
        if (typeof body.preferred_bible_version === 'string') {
            const allowedVersions = ['ESV', 'KJV', 'WEB', 'NIV', 'NASB', 'NLT', 'ASV'];
            const upper = body.preferred_bible_version.toUpperCase();
            safeUpdates.preferred_bible_version = allowedVersions.includes(upper) ? upper : 'ESV';
        }
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
        return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return handleProfileUpdate(req);
}

export async function PATCH(req: NextRequest) {
    return handleProfileUpdate(req);
}
