// @ts-nocheck
// Setup: Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

const ALLOWED_ORIGINS = [
    "https://bible-rhema-ai.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "";
    const isAllowed = ALLOWED_ORIGINS.includes(origin);
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized: Authentication required" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const token = authHeader.replace('Bearer ', '').trim();
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const isServiceRole = Boolean(serviceRoleKey && token === serviceRoleKey);

        let userId: string | null = null;

        if (!isServiceRole) {
            const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
            const authClient = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false }
            });

            const { data: userData, error: userError } = await authClient.auth.getUser(token);
            if (userError || !userData?.user?.id) {
                return new Response(JSON.stringify({ error: "Unauthorized: Invalid or unverified token" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                });
            }
            userId = userData.user.id;
        }

        const { query } = await req.json();
        if (!query || typeof query !== 'string' || !query.trim()) {
            throw new Error('Valid query string is required');
        }

        // 1. Init Clients
        const supabaseKey = serviceRoleKey || Deno.env.get('SUPABASE_ANON_KEY')!;
        const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);
        const genAI = new GoogleGenerativeAI(googleApiKey);

        // 2. Embed Query
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(query);
        const queryEmbedding = embeddingResult.embedding.values;

        // 2a. Fetch User Profile for Context
        let userProfile = null;
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('spiritual_goals, struggles, favorite_ministers, preferred_bible_version, denominational_bias')
                .eq('id', userId)
                .maybeSingle();
            userProfile = profile;
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

        // 5. Generate Response
        const modelName = Deno.env.get('GEMINI_MODEL') || "gemini-2.5-flash";
        const genModel = genAI.getGenerativeModel({ model: modelName });
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
