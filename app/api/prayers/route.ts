import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        // 1. Enforce authentication on all prayer endpoints (no anonymous scraping)
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: "Authentication required to access The Altar and prayer wall."
            }, { status: 401 });
        }

        const url = new URL(req.url);
        const feed = url.searchParams.get("feed");
        const supabase = getSupabaseServerClient();

        if (feed === "community") {
            // Fetch public community prayers with privacy-safe field selection
            // Exclude prayers that are marked private or have been reported by the community
            const { data, error } = await supabase
                .from('prayers')
                .select('id, title, description, is_community, author_name, status, prayed_count, scripture_ref, created_at, answered_at, testimony, user_id')
                .eq('is_community', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Community prayers fetch error:", error);
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            // Mask user_id to prevent tracking while allowing author self-identification
            const sanitized = (data || []).map((p: any) => ({
                ...p,
                is_author: p.user_id === userId,
                user_id: undefined // Don't expose other users' account IDs
            }));

            return NextResponse.json({ success: true, data: sanitized });
        }

        // Default: Fetch authenticated user's own prayers
        const { data, error } = await supabase
            .from('prayers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("User prayers fetch error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (e: any) {
        console.error("Error in GET /api/prayers:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to fetch prayers" }, { status: 500 });
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
            community_consent = false,
            author_name,
            ai_strategy,
            scripture_ref
        } = body;

        if (!title || typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ success: false, error: "Prayer title is required" }, { status: 400 });
        }

        if (title.length > 300) {
            return NextResponse.json({ success: false, error: "Prayer title cannot exceed 300 characters" }, { status: 400 });
        }

        if (description && typeof description === 'string' && description.length > 3000) {
            return NextResponse.json({ success: false, error: "Prayer description cannot exceed 3000 characters" }, { status: 400 });
        }

        // Release-blocking safeguard: community publication requires explicit consent and valid non-empty content
        let safeIsCommunity = false;
        if (Boolean(is_community)) {
            if (!community_consent) {
                return NextResponse.json({
                    success: false,
                    error: "Explicit consent is required to share petitions to the community prayer wall."
                }, { status: 400 });
            }
            safeIsCommunity = true;
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

        // Sanitize author name
        const safeAuthorName = (author_name && typeof author_name === 'string')
            ? author_name.slice(0, 50).trim()
            : (clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName?.[0] ? clerkUser.lastName[0] + '.' : ''}` : 'Fellow Believer');

        const { data, error } = await supabase
            .from('prayers')
            .insert({
                user_id: userId,
                title: title.trim(),
                description: description ? description.trim() : null,
                is_community: safeIsCommunity,
                author_name: safeAuthorName,
                status: 'active',
                ai_strategy: ai_strategy || null,
                scripture_ref: scripture_ref || null,
                prayed_count: 0
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating prayer:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Record user activity for streak
        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        console.error("Error in POST /api/prayers:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to create prayer" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, action, status, testimony, is_community } = body;

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: "Valid prayer ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Community Moderation Reporting Action
        if (action === 'report') {
            const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : 'Inappropriate or sensitive content';
            // Unpublish reported prayer immediately from community wall to protect users
            const { error: reportErr } = await supabase
                .from('prayers')
                .update({ is_community: false })
                .eq('id', id);

            if (reportErr) {
                console.error("Error reporting prayer:", reportErr);
                return NextResponse.json({ success: false, error: reportErr.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "Petition reported and removed from the community prayer wall for moderation review."
            });
        }

        // Author Updates (status, testimony, unpublish / publish)
        const updates: any = {};
        if (status) {
            if (!['active', 'answered', 'archived'].includes(status)) {
                return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
            }
            updates.status = status;
            if (status === 'answered') {
                updates.answered_at = new Date().toISOString();
            }
        }
        if (testimony !== undefined) {
            updates.testimony = typeof testimony === 'string' ? testimony.slice(0, 3000) : null;
        }
        if (is_community !== undefined) {
            updates.is_community = Boolean(is_community);
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

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: "Valid prayer ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('prayers')
            .delete()
            .eq('id', id)
            .eq('user_id', userId); // Enforce ownership

        if (error) {
            console.error("Error deleting prayer:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error in DELETE /api/prayers:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
