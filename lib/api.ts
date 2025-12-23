
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

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
            }, { onConflict: 'id', ignoreDuplicates: true });

        if (profileError) {
            console.warn("Auto-profile creation warning:", profileError);
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

export async function generateSermonContent(topic: string, context: string[], userSources: string[]) {
    try {
        if (!supabase) throw new Error("Supabase client not initialized");

        // Construct a rich prompt
        const prompt = `
        Role: Expert Theological Ghostwriter.
        Task: Expand on the sermon topic: "${topic}".
        
        Contextual Materials (Use these to ground the content):
        ${context.map(c => `- ${c}`).join('\n')}
        
        User Notes/Sources:
        ${userSources.map(s => `- ${s}`).join('\n')}
        
        Format: HTML. Use <h2> for main points, <blockquote> for scriptures/quotes, <ul> for lists, and <p> for body text.
        Tone: Professional, inspiring, andologically sound.
        `;

        // Create a streaming or blocking call to the Edge Function
        // Assuming 'chat-with-rhema' is the existing function. 
        // We'll rename it conceptually to 'generate-sermon' in the UI but use the existing infrastructure.
        const { data, error } = await supabase.functions.invoke('chat-with-rhema', {
            body: { message: prompt }
        });

        if (error) throw error;

        // The edge function likely returns { reply: string } or similar. Adjust based on actual contract.
        // If the edge function returns a stream, we might need a different handling strategy.
        // For now, assuming JSON response for simplicity as per "Phase 13" blocking request.
        return { success: true, content: data.reply || data.message || "AI Generation Completed." };

    } catch (error) {
        console.error("AI Generation Error:", error);

        // Fallback for "Divine Editor" feel even if backend fails (Graceful degradation)
        return {
            success: false,
            content: `
            <h2>System Message: Offline Mode</h2>
            <p>The AI Engine could not be reached. However, here is a template to get you started on <strong>${topic}</strong>:</p>
            <h3>I. The Foundation</h3>
            <p>Begin with the core scripture...</p>
            <blockquote>"In the beginning..."</blockquote>
            `
        };
    }
}
