import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        const url = new URL(req.url);
        const feed = url.searchParams.get("feed");

        const supabase = getSupabaseServerClient();

        if (feed === "community") {
            // Fetch public community prayers
            const { data, error } = await supabase
                .from('prayers')
                .select('*')
                .eq('is_community', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Community prayers fetch error:", error);
                return NextResponse.json({ success: true, data: [] });
            }

            return NextResponse.json({ success: true, data: data || [] });
        }

        // Default: Fetch user's own private and authored prayers
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('prayers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("User prayers fetch error:", error);
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (e: any) {
        return NextResponse.json({ success: true, data: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const clerkUser = await currentUser();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            title,
            description,
            is_community = false,
            author_name,
            ai_strategy,
            scripture_ref
        } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Ensure user profile exists
        await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || 'Believer',
                email: clerkUser?.emailAddresses?.[0]?.emailAddress || ''
            }, { onConflict: 'id', ignoreDuplicates: true });

        const displayName = author_name || (clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName?.[0] ? clerkUser.lastName[0] + '.' : ''}` : 'Fellow Believer');

        const { data, error } = await supabase
            .from('prayers')
            .insert({
                user_id: userId,
                title: title.trim(),
                description: description || null,
                is_community: Boolean(is_community),
                author_name: displayName,
                status: 'active',
                ai_strategy: ai_strategy || null,
                scripture_ref: scripture_ref || null,
                prayed_count: 0,
                intercessors: []
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating prayer:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status, testimony } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "Prayer ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const updates: any = {};
        if (status) {
            updates.status = status;
            if (status === 'answered') {
                updates.answered_at = new Date().toISOString();
            }
        }
        if (testimony !== undefined) {
            updates.testimony = testimony;
        }

        const { data, error } = await supabase
            .from('prayers')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Enforce ownership
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Prayer ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('prayers')
            .delete()
            .eq('id', id)
            .eq('user_id', userId); // Enforce ownership

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
