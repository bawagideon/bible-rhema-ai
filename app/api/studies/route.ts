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
            .from('saved_studies')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching saved studies:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (e: any) {
        console.error("Error in GET /api/studies:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to load studies" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, mode = 'exegesis', query, content, scripture_ref } = body;

        if (!content || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json({ success: false, error: "Study content is required" }, { status: 400 });
        }

        const safeMode = mode === 'exegesis' ? 'exegesis' : 'devotion';

        const supabase = getSupabaseServerClient();

        // Ensure user profile exists
        await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

        const safeTitle = (title || query || "Scripture Study").trim().slice(0, 300);

        const { data, error } = await supabase
            .from('saved_studies')
            .insert({
                user_id: userId,
                title: safeTitle,
                mode: safeMode,
                query: (query || "").slice(0, 1000),
                content: content.trim(),
                scripture_ref: scripture_ref ? String(scripture_ref).slice(0, 100) : null
            })
            .select()
            .single();

        if (error) {
            console.error("Study insert error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Record user activity for streak
        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        console.error("Error in POST /api/studies:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to save study" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, title, content, scripture_ref } = body;

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: "Valid study ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const updates: any = {};
        if (typeof title === 'string') updates.title = title.trim().slice(0, 300);
        if (typeof content === 'string') {
            if (!content.trim()) return NextResponse.json({ success: false, error: "Content cannot be empty" }, { status: 400 });
            updates.content = content.trim();
        }
        if (scripture_ref !== undefined) updates.scripture_ref = scripture_ref ? String(scripture_ref).slice(0, 100) : null;

        const { data, error } = await supabase
            .from('saved_studies')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Enforce ownership
            .select()
            .single();

        if (error) {
            console.error("Study update error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        console.error("Error in PATCH /api/studies:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to update study" }, { status: 500 });
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
            return NextResponse.json({ success: false, error: "Valid study ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('saved_studies')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
