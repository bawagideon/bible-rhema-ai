import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching journal entries:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (e: any) {
        console.error("Error in GET /api/journal:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to load journals" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, scripture_ref, tags = [] } = body;

        if (!content || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json({ success: false, error: "Journal content is required" }, { status: 400 });
        }

        if (content.length > 20000) {
            return NextResponse.json({ success: false, error: "Journal content exceeds maximum allowed length" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Ensure user profile exists
        await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

        const safeTitle = (title && typeof title === 'string')
            ? title.trim().slice(0, 300)
            : "Spiritual Reflection";

        const { data, error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: userId,
                title: safeTitle,
                content: content.trim(),
                scripture_ref: scripture_ref ? String(scripture_ref).slice(0, 100) : null,
                tags: Array.isArray(tags) ? tags.slice(0, 10) : []
            })
            .select()
            .single();

        if (error) {
            console.error("Journal insert error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Record user activity for streak
        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        console.error("Error in POST /api/journal:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to save journal" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, title, content, scripture_ref, tags } = body;

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: "Valid journal entry ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (typeof title === 'string') updates.title = title.trim().slice(0, 300);
        if (typeof content === 'string') {
            if (!content.trim()) return NextResponse.json({ success: false, error: "Content cannot be empty" }, { status: 400 });
            updates.content = content.trim().slice(0, 20000);
        }
        if (scripture_ref !== undefined) updates.scripture_ref = scripture_ref ? String(scripture_ref).slice(0, 100) : null;
        if (Array.isArray(tags)) updates.tags = tags.slice(0, 10);

        const { data, error } = await supabase
            .from('journal_entries')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Enforce ownership
            .select()
            .single();

        if (error) {
            console.error("Journal update error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Record activity
        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        console.error("Error in PATCH /api/journal:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to update journal" }, { status: 500 });
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
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('journal_entries')
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
