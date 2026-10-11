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
            .from('prayers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
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
        const { title, ai_strategy, scripture_ref } = body;

        const supabase = getSupabaseServerClient();

        // Ensure profile exists
        await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

        const { data, error } = await supabase
            .from('prayers')
            .insert({
                user_id: userId,
                title: title || "New Intercession",
                status: 'active',
                ai_strategy: ai_strategy || null,
                scripture_ref: scripture_ref || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({
                success: true,
                data: {
                    id: Date.now().toString(),
                    user_id: userId,
                    title,
                    status: 'active',
                    created_at: new Date().toISOString()
                }
            });
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
        const { id, status } = body;

        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('prayers')
            .update({
                status,
                answered_at: status === 'answered' ? new Date().toISOString() : null
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

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

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        await supabase
            .from('prayers')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
