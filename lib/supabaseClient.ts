import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Creates a browser-safe Supabase client for data operations.
 * Session persistence is disabled to prevent Navigator LockManager conflicts,
 * as Clerk manages the user identity.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

/**
 * Creates an authenticated client that carries the Clerk User's JWT token.
 * @param clerkToken - The token from `await getToken({ template: 'supabase' })`
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${clerkToken}`,
            },
        },
    });
};
