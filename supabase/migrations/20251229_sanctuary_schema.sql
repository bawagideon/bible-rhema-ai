-- Create PRAYERS table
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk ID
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'answered', 'archived')) DEFAULT 'active',
    ai_strategy TEXT, -- The tactical prayer plan
    scripture_ref TEXT, -- e.g., "Hebrews 4:12"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

-- Helper function to get Clerk User ID from JWT (if not already existing from previous migration)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        COALESCE(
            current_setting('request.jwt.claim.sub', true),
            (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
        ),
        ''
    )::text;
$$ LANGUAGE SQL STABLE;

-- RLS Policies
CREATE POLICY "Users can view their own prayers"
ON public.prayers FOR SELECT
USING (requesting_user_id() = user_id);

CREATE POLICY "Users can create their own prayers"
ON public.prayers FOR INSERT
WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update their own prayers"
ON public.prayers FOR UPDATE
USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete their own prayers"
ON public.prayers FOR DELETE
USING (requesting_user_id() = user_id);

-- Create Index for performance
CREATE INDEX IF NOT EXISTS prayers_user_id_idx ON public.prayers(user_id);

-- Create USER_STATS table for streaks (Optional but good for Gamification)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id TEXT PRIMARY KEY, -- Clerk ID
    prayer_streak_days INTEGER DEFAULT 0,
    last_prayed_at TIMESTAMPTZ,
    total_prayers_logged INTEGER DEFAULT 0
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
ON public.user_stats FOR SELECT
USING (requesting_user_id() = user_id);

CREATE POLICY "Users can update their own stats" -- E.g. via Edge Function or client
ON public.user_stats FOR ALL
USING (requesting_user_id() = user_id);
