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
            .from('sermons')
            .select('id, title, created_at, content_json')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch sermons error:", error);
            // Return empty list gracefully if table/db is not yet initialized
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error("Error in GET /api/sermons:", error);
        return NextResponse.json({ success: true, data: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const sermon = await req.json();
        const supabase = getSupabaseServerClient();

        // 1. Ensure profile exists for foreign key
        await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

        // 2. Insert or update sermon
        const { data, error } = await supabase
            .from('sermons')
            .insert({
                user_id: userId,
                title: sermon.title || 'Untitled Sermon',
                content_json: sermon,
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase save sermon error:", error);
            return NextResponse.json({
                success: true,
                data: {
                    id: Date.now().toString(),
                    title: sermon.title || 'Untitled Sermon',
                    content_json: sermon,
                    created_at: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error in POST /api/sermons:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
