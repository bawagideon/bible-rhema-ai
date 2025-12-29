import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a "dumb" client for public data (no login required).
 */
console.log("Initializing Supabase Client...", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
});
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates a "smart" client that carries the Clerk User's ID.
 * Use this whenever you need to save/read user data (RLS).
 * * @param clerkToken - The token from `await getToken({ template: 'supabase' })`
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${clerkToken}`,
            },
        },
    });
};
