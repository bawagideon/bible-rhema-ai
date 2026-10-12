import { createClient } from "@supabase/supabase-js";

/**
 * Returns a high-privilege Supabase client using the Service Role Key.
 * FAILS FAST if the service role key is not configured.
 * Never silently falls back to an anonymous key or placeholder.
 */
export function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        throw new Error("Critical Configuration Error: NEXT_PUBLIC_SUPABASE_URL is missing.");
    }

    if (!serviceRoleKey) {
        throw new Error("Critical Security Error: SUPABASE_SERVICE_ROLE_KEY is missing on server.");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}

/**
 * Returns a public/anonymous server Supabase client for reading unprivileged public data.
 */
export function getSupabaseAnonServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        throw new Error("Configuration Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
    }

    return createClient(supabaseUrl, anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
