
import { supabase } from '@/lib/supabaseClient';
import { SermonData } from '@/components/studio/sermon-builder';

export interface SavedSermon {
    id: string;
    title: string;
    content_json: SermonData;
    created_at: string;
}

export async function saveSermon(sermon: SermonData) {
    try {
        if (!supabase) throw new Error("Supabase client not initialized");

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("User not authenticated");
        }

        // SELF-HEALING: Ensure profile exists before saving sermon
        // This prevents the foreign key constraint error if the trigger failed or didn't run.
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                // We don't overwrite other fields to preserve existing data if any
            }, { onConflict: 'id', ignoreDuplicates: true }); // Just ensure it exists

        if (profileError) {
            console.warn("Auto-profile creation warning:", profileError);
            if (profileError.code === '42501') {
                // RLS Violation
                throw new Error("Database Permission Error: You need to run the 'fix_rls.sql' script in Supabase to allow profile creation.");
            }
            // We continue anyway, hoping it might just be a permissions thing and the row exists.
        }

        const { data, error } = await supabase
            .from('sermons')
            .upsert({
                user_id: user.id,
                title: sermon.title || 'Untitled Sermon',
                content_json: sermon,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error saving sermon:", error);
        return { success: false, error };
    }
}

export async function fetchSermons() {
    try {
        if (!supabase) throw new Error("Supabase client not initialized");

        const { data, error } = await supabase
            .from('sermons')
            .select('id, title, created_at, content_json')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data as SavedSermon[] };
    } catch (error) {
        console.error("Error fetching sermons:", error);
        return { success: false, error };
    }
}
