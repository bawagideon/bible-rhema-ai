// @ts-nocheck
// Setup: Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';
import * as jose from "https://esm.sh/jose@5.9.6";

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

function getTrustedClerkIssuer(): string | null {
    const configuredIssuer = Deno.env.get('CLERK_ISSUER_URL');
    if (configuredIssuer) {
        return configuredIssuer.replace(/\/$/, '');
    }

    const frontendApi = Deno.env.get('CLERK_FRONTEND_API');
    if (frontendApi) {
        return `https://${frontendApi.replace(/\/$/, '')}`;
    }

    const publishableKey = Deno.env.get('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') || Deno.env.get('CLERK_PUBLISHABLE_KEY');
    if (publishableKey) {
        const parts = publishableKey.trim().split('_');
        if (parts.length >= 3) {
            try {
                const b64 = parts.slice(2).join('_').replace(/[\$=]/g, '');
                const domain = atob(b64).replace(/[\$\x00-\x1F\x7F-\x9F]/g, '').trim();
                if (domain && domain.includes('.')) {
                    return `https://${domain}`;
                }
            } catch {
                // Ignore decoding errors
            }
        }
    }

    return null;
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
            // 1. Check native Supabase Auth session
            const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
            if (supabaseAnonKey) {
                try {
                    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
                        auth: { persistSession: false }
                    });
                    const { data: userData } = await authClient.auth.getUser(token);
                    if (userData?.user?.id) {
                        userId = userData.user.id;
                    }
                } catch {
                    // Fall through to Clerk verification
                }
            }

            // 2. Check Clerk JWT using ONLY the trusted server-configured issuer
            if (!userId) {
                const trustedIssuer = getTrustedClerkIssuer();
                if (trustedIssuer) {
                    try {
                        const jwksUrl = new URL(`${trustedIssuer}/.well-known/jwks.json`);
                        const JWKS = jose.createRemoteJWKSet(jwksUrl);
                        const { payload } = await jose.jwtVerify(token, JWKS, {
                            issuer: trustedIssuer
                        });
                        if (payload?.sub) {
                            userId = payload.sub as string;
                        }
                    } catch (clerkErr) {
                        console.warn("[EDGE AUTH] Clerk cryptographic verification failed:", clerkErr?.message);
                    }
                } else {
                    console.warn("[EDGE AUTH] No trusted Clerk issuer configured in environment (CLERK_ISSUER_URL or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)");
                }
            }

            if (!userId) {
                return new Response(JSON.stringify({ error: "Unauthorized: Invalid or unverified token" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                });
            }
        } else {
            // Service role invocation may specify acting user ID via header
            userId = req.headers.get('x-user-id') || null;
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
