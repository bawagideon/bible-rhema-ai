import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
}

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.warn("CLERK_WEBHOOK_SECRET is not configured.");
        return new Response('Webhook secret missing', { status: 500 });
    }

    // Get the headers asynchronously (Next.js 15)
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error: missing Svix headers', { status: 400 });
    }

    // Get the raw body text for Svix verification
    const body = await req.text();

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying Clerk webhook signature:', err);
        return new Response('Invalid webhook signature', { status: 400 });
    }

    const eventType = evt.type;
    const supabase = getSupabaseClient();

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, primary_email_address_id, image_url } = evt.data;

        const email = email_addresses?.find(e => e.id === primary_email_address_id)?.email_address ||
            email_addresses?.[0]?.email_address ||
            `${id}@rhema.internal`;
        const name = `${first_name || ''} ${last_name || ''}`.trim() || 'Fellow Disciple';

        console.log(`[CLERK WEBHOOK] Creating user ${id} (${email})`);

        const { error } = await supabase.from('profiles').upsert({
            id: id,
            email: email,
            full_name: name,
            avatar_url: image_url || null,
            tier: 'SEEKER',
            subscription_status: 'active',
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'id',
            ignoreDuplicates: true
        });

        if (error) {
            console.error('[CLERK WEBHOOK] Error creating profile:', error);
            return new Response(`Database sync error: ${error.message}`, { status: 500 });
        }

        // Initialize user stats cleanly at 0
        await supabase.from('user_stats').upsert({
            user_id: id,
            prayer_streak_days: 0,
            longest_streak_days: 0,
            total_minutes_prayed: 0,
            total_focus_minutes: 0
        }, { onConflict: 'user_id' });

        console.log(`[CLERK WEBHOOK] User ${id} created successfully.`);
    } else if (eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, primary_email_address_id, image_url } = evt.data;

        const email = email_addresses?.find(e => e.id === primary_email_address_id)?.email_address ||
            email_addresses?.[0]?.email_address;
        const name = `${first_name || ''} ${last_name || ''}`.trim();

        console.log(`[CLERK WEBHOOK] Updating user ${id}`);

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };
        if (email) updateData.email = email;
        if (name) updateData.full_name = name;
        if (image_url) updateData.avatar_url = image_url;

        // NOTE: We do NOT overwrite tier or subscription_status on user.updated
        const { error } = await supabase.from('profiles').update(updateData).eq('id', id);

        if (error) {
            console.error('[CLERK WEBHOOK] Error updating profile:', error);
            return new Response(`Database sync error: ${error.message}`, { status: 500 });
        }

        console.log(`[CLERK WEBHOOK] User ${id} updated successfully without affecting tier.`);
    } else if (eventType === 'user.deleted') {
        const { id } = evt.data;
        if (id) {
            console.log(`[CLERK WEBHOOK] Deleting user ${id}`);
            await supabase.from('profiles').delete().eq('id', id);
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
