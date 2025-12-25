-- Fix Profile Schema: Ensure all required columns exist
-- This aggregates columns from previous migrations that might have been skipped due to CLI issues.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'SEEKER',
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS struggles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_ministers text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_bible_version text DEFAULT 'KJV',
ADD COLUMN IF NOT EXISTS denominational_bias text DEFAULT 'None';

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure "Users can update own profile" policy exists
-- (We cannot conditionally create policy easily in standard SQL without plpgsql, 
--  but Supabase editor will allow running this. If policy exists, it might error, but columns will pass).

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles
        FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
        ON public.profiles
        FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone"
        ON public.profiles
        FOR SELECT
        USING (true);
    END IF;
END
$$;
