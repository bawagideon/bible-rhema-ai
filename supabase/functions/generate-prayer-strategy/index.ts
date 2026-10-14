// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized: Authorization header required" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const token = authHeader.replace('Bearer ', '').trim();
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const isServiceRole = Boolean(serviceRoleKey && token === serviceRoleKey);

        let callingUserId: string | null = null;

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
                        callingUserId = userData.user.id;
                    }
                } catch {
                    // Fall through to Clerk verification
                }
            }

            // 2. Check Clerk JWT using ONLY the trusted server-configured issuer
            if (!callingUserId) {
                const trustedIssuer = getTrustedClerkIssuer();
                if (trustedIssuer) {
                    try {
                        const jwksUrl = new URL(`${trustedIssuer}/.well-known/jwks.json`);
                        const JWKS = jose.createRemoteJWKSet(jwksUrl);
                        const { payload } = await jose.jwtVerify(token, JWKS, {
                            issuer: trustedIssuer
                        });
                        if (payload?.sub) {
                            callingUserId = payload.sub as string;
                        }
                    } catch (clerkErr) {
                        console.warn("[EDGE AUTH] Clerk cryptographic verification failed:", clerkErr?.message);
                    }
                } else {
                    console.warn("[EDGE AUTH] No trusted Clerk issuer configured in environment (CLERK_ISSUER_URL or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)");
                }
            }

            if (!callingUserId) {
                return new Response(JSON.stringify({ error: "Unauthorized: Invalid or unverified token" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                });
            }
        }

        const { prayer_id, request_text, user_profile } = await req.json();
        if (!prayer_id || !request_text) {
            return new Response(JSON.stringify({ error: "prayer_id and request_text are required" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Verify caller ownership for authenticated user
        if (callingUserId) {
            const { data: existingPrayer, error: checkError } = await supabase
                .from('prayers')
                .select('user_id')
                .eq('id', prayer_id)
                .maybeSingle();

            if (checkError || !existingPrayer) {
                return new Response(JSON.stringify({ error: "Prayer not found" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 404,
                });
            }

            if (existingPrayer.user_id !== callingUserId) {
                return new Response(JSON.stringify({ error: "Forbidden: Not permitted to modify this prayer strategy" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 403,
                });
            }
        } else if (!isServiceRole) {
            return new Response(JSON.stringify({ error: "Unauthorized: Missing verified user identity" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        console.log(`Generating strategy for prayer: ${prayer_id}`);

        // Theological strategy generator based on biblical promises
        let strategy = "Stand firm in faith. Declare God's promises over this situation daily.";
        let scriptureRef = "Hebrews 11:1";

        const lowerText = request_text.toLowerCase();
        if (lowerText.includes('heal') || lowerText.includes('sick') || lowerText.includes('pain')) {
            strategy = "Activate the healing covenant. Speak life over the physical body and command symptoms to bow to the name of Jesus.";
            scriptureRef = "Isaiah 53:5";
        } else if (lowerText.includes('money') || lowerText.includes('job') || lowerText.includes('finance') || lowerText.includes('provide')) {
            strategy = "Position yourself for provision. Sow a seed of faith and trust that God is your source, not the economy.";
            scriptureRef = "Philippians 4:19";
        } else if (lowerText.includes('fear') || lowerText.includes('anxiety') || lowerText.includes('worry')) {
            strategy = "Disarm the spirit of fear. It has no legal right to your mind. Replace every fearful thought with a promise of God.";
            scriptureRef = "2 Timothy 1:7";
        } else if (lowerText.includes('family') || lowerText.includes('child') || lowerText.includes('marriage')) {
            strategy = "Build a hedge of protection. Plead the blood of Jesus over your household and decree peace within your walls.";
            scriptureRef = "Joshua 24:15";
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
