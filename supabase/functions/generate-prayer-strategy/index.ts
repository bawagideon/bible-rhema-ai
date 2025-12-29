// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prayer_id, request_text, user_profile } = await req.json();

        // Initialize Supabase (Admin Context for AI writing)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log(`Generating strategy for prayer: ${prayer_id}`);

        // MOCK AI LOGIC (Replace with OpenAI/Gemini call later)
        // Simple keyword matching for MVP
        let strategy = "Stand firm in faith. Declare God's promises over this situation daily.";
        let scriptureRef = "Hebrews 11:1";
        let scriptureText = "Now faith is the substance of things hoped for, the evidence of things not seen.";

        const lowerText = request_text.toLowerCase();

        if (lowerText.includes('heal') || lowerText.includes('sick') || lowerText.includes('pain')) {
            strategy = "Activate the healing covenant. Speak life over the physical body and command symptoms to bow to the name of Jesus.";
            scriptureRef = "Isaiah 53:5";
            scriptureText = "But He was wounded for our transgressions, He was bruised for our iniquities; The chastisement for our peace was upon Him, And by His stripes we are healed.";
        } else if (lowerText.includes('money') || lowerText.includes('job') || lowerText.includes('finance') || lowerText.includes('provide')) {
            strategy = "Position yourself for provision. Sow a seed of faith and trust that God is your source, not the economy.";
            scriptureRef = "Philippians 4:19";
            scriptureText = "And my God shall supply all your need according to His riches in glory by Christ Jesus.";
        } else if (lowerText.includes('fear') || lowerText.includes('anxiety') || lowerText.includes('worry')) {
            strategy = "Disarm the spirit of fear. It has no legal right to your mind. Replace every fearful thought with a promise of God.";
            scriptureRef = "2 Timothy 1:7";
            scriptureText = "For God has not given us a spirit of fear, but of power and of love and of a sound mind.";
        } else if (lowerText.includes('family') || lowerText.includes('child') || lowerText.includes('marriage')) {
            strategy = "Build a hedge of protection. Plead the blood of Jesus over your household and decree peace within your walls.";
            scriptureRef = "Joshua 24:15";
            scriptureText = "But as for me and my house, we will serve the Lord.";
        }

        // Update Prayer Record
        const { error } = await supabase
            .from('prayers')
            .update({
                ai_strategy: strategy,
                scripture_ref: scriptureRef
            })
            .eq('id', prayer_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, strategy, scriptureRef }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
