import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Journal table read note:", error.message);
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

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, scripture_ref, tags = [] } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ success: false, error: "Journal content is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Ensure user profile exists
        await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

        const { data, error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: userId,
                title: (title || "Spiritual Reflection").trim(),
                content: content.trim(),
                scripture_ref: scripture_ref || null,
                tags: Array.isArray(tags) ? tags : []
            })
            .select()
            .single();

        if (error) {
            console.error("Journal insert error:", error);
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
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('journal_entries')
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
