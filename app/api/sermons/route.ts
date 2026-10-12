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
            .from('sermons')
            .select('id, title, created_at, updated_at, content_json')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch sermons error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error("Error in GET /api/sermons:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to fetch sermons" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const sermon = await req.json();

        if (!sermon || typeof sermon !== 'object') {
            return NextResponse.json({ success: false, error: "Invalid sermon payload" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // 1. Ensure profile exists for foreign key
        await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

        // 2. Upsert sermon: update if id provided, insert if new
        let query;
        if (sermon.id && typeof sermon.id === 'string' && !sermon.id.startsWith('temp_')) {
            query = supabase
                .from('sermons')
                .update({
                    title: (sermon.title || 'Untitled Sermon').trim().slice(0, 300),
                    content_json: sermon,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sermon.id)
                .eq('user_id', userId)
                .select()
                .single();
        } else {
            query = supabase
                .from('sermons')
                .insert({
                    user_id: userId,
                    title: (sermon.title || 'Untitled Sermon').trim().slice(0, 300),
                    content_json: sermon,
                })
                .select()
                .single();
        }

        const { data, error } = await query;

        if (error) {
            console.error("Supabase save sermon error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Record user activity for streak
        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error in POST /api/sermons:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to save sermon" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sermonId = searchParams.get('id');

        if (!sermonId) {
            return NextResponse.json({ success: false, error: "Sermon ID is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('sermons')
            .delete()
            .eq('id', sermonId)
            .eq('user_id', userId);

        if (error) {
            console.error("Error deleting sermon:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in DELETE /api/sermons:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to delete sermon" }, { status: 500 });
    }
}
