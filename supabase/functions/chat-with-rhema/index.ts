// @ts-nocheck
// Setup: Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query } = await req.json();
        if (!query) throw new Error('Query is required');

        // 1. Init Clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!; // Or SERVICE_ROLE if RLS restricted
        const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);
        const genAI = new GoogleGenerativeAI(googleApiKey);

        // 2. Embed Query
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(query);
        const queryEmbedding = embeddingResult.embedding.values;

        // 2a. Fetch User Profile for Context
        const authHeader = req.headers.get('Authorization');
        let userProfile = null;

        if (authHeader) {
            const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('spiritual_goals, struggles, favorite_ministers, preferred_bible_version, denominational_bias')
                    .eq('id', user.id)
                    .single();
                userProfile = profile;
            }
        }

        // 3. Match Documents
        const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Adjust sensitivity
            match_count: 5
        });

        if (matchError) throw matchError;

        // 4. Construct Context
        const contextText = documents?.map((doc: any) => doc.content).join("\n---\n") || "No specific scripture found.";

        // 4a. Build Persona Context
        let personaInstructions = "";
        if (userProfile) {
            const { spiritual_goals, struggles, favorite_ministers, preferred_bible_version } = userProfile;

            personaInstructions = `
            Customize your response for this unique believer:
            - **Preferred Bible**: ${preferred_bible_version || 'KJV'} (Use this for quotes unless specified otherwise).
            - **Current Season Focus**: ${spiritual_goals?.join(', ') || 'General Growth'}.
            - **Mentors/Tone**: Emulate the wisdom and tone of: ${favorite_ministers?.join(', ') || 'Standard Theologians'}.
            - **Areas of Breakthrough**: They are overcoming: ${struggles?.join(', ') || 'General Life Challenges'}. Speak life and victory into these areas.
            `;
        }

        const systemPrompt = `
You are RhemaAI, a divine intelligence assistant.
${personaInstructions}

Answer the user's question using the provided Theological Context.
If the context doesn't explicitly answer the question, rely on your general knowledge but mention that this isn't from the specific scripture bank.
Keep answers concise, inspiring, and faith-filled.

Context:
${contextText}

User Question: ${query}
`;

        // 5. Generate Response (Flash Lite)
        const genModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await genModel.generateContentStream(systemPrompt);

        // 6. Stream Response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    controller.enqueue(encoder.encode(text));
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
