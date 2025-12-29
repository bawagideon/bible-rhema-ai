
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');

        if (!supabaseUrl || !supabaseServiceKey || !googleApiKey) {
            throw new Error(`Missing Environment Variables: ${!supabaseUrl ? 'URL ' : ''}${!supabaseServiceKey ? 'SERVICE_KEY ' : ''}${!googleApiKey ? 'GOOGLE_KEY ' : ''}`);
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const genAI = new GoogleGenerativeAI(googleApiKey);

        // 1. Get User from Clerk JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization Header');

        // Decode Clerk Token manually (since supabase.auth.getUser() relies on auth.users which is empty)
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

        if (!userId) throw new Error('Invalid Token: No sub claim');
        const user = { id: userId }; // Mock user object for compatibility

        // 2. Check if content already exists for today (prevent race conditions)
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('daily_rhema')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (existing) {
            return new Response(JSON.stringify(existing), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Fetch Profile Data
        const { data: profile } = await supabase
            .from('profiles')
            .select('spiritual_goals, struggles, preferred_bible_version')
            .eq('id', user.id)
            .single();

        const goals = profile?.spiritual_goals?.join(', ') || 'Growth in Grace';
        const struggles = profile?.struggles?.join(', ') || 'Daily Distractions';
        const bible = profile?.preferred_bible_version || 'KJV';

        // 4. Generate Content with Gemini
        let generatedData;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite", generationConfig: { responseMimeType: "application/json" } });

            const prompt = `
            You are a spiritual mentor. Generate a 'Daily Rhema' for a believer.
            
            Context:
            - Goals: ${goals}
            - Struggles: ${struggles}
            - Bible Version: ${bible}
            
            Output a JSON object with these exact keys:
            - "scripture_ref": A formatted scripture reference (e.g., "John 3:16 (${bible})").
            - "scripture_text": The actual text of the verse.
            - "content": A short, 2-3 sentence encouraging word connecting the scripture to their goals/struggles.
            - "prayer_focus": A 1-sentence prayer declaration.
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            try {
                generatedData = JSON.parse(responseText);
            } catch (jsonErr) {
                console.error("JSON Parse Error:", responseText);
                throw new Error("Failed to parse AI response: " + responseText.substring(0, 100));
            }
        } catch (aiErr: any) {
            throw new Error("Gemini AI Error: " + aiErr.message);
        }

        // 5. Insert into DB
        // 5. Upsert into DB (Prevent race conditions)
        const { data: inserted, error: insertError } = await supabase
            .from('daily_rhema')
            .upsert({
                user_id: user.id,
                date: today,
                scripture_ref: generatedData.scripture_ref,
                scripture_text: generatedData.scripture_text,
                content: generatedData.content,
                prayer_focus: generatedData.prayer_focus
            }, { onConflict: 'user_id, date' })
            .select() // Return the inserted row
            .single();

        if (insertError) throw new Error("DB Insert Error: " + insertError.message);

        return new Response(JSON.stringify(inserted), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
