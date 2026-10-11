-- ==============================================================================
-- BIBLE RHEMA AI - UNIFIED PRODUCTION SCHEMA MIGRATION
-- Compatible with Clerk Authentication (TEXT user IDs) & Secure Row Level Security
-- ==============================================================================

BEGIN;

-- 1. CLERK AUTH BRIDGE FUNCTION
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

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Clerk User ID (user_2b...)
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'SEEKER' CHECK (tier IN ('SEEKER', 'DISCIPLE', 'MINISTER', 'GUEST')),
    paypal_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    preferred_bible_version TEXT DEFAULT 'ESV',
    spiritual_goals TEXT[] DEFAULT '{}',
    struggles TEXT[] DEFAULT '{}',
    favorite_ministers TEXT[] DEFAULT '{}',
    denominational_bias TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was previously created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'SEEKER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_bible_version TEXT DEFAULT 'ESV';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_goals TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS struggles TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_ministers TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS denominational_bias TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (requesting_user_id() = id OR id = 'public');

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (requesting_user_id() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (requesting_user_id() = id);


-- 3. SUBSCRIPTION DEFINER FUNCTION (Fixed TEXT User ID)
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_user_id TEXT,
  p_tier TEXT,
  p_sub_id TEXT,
  p_status TEXT,
  p_period_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    tier = p_tier,
    paypal_subscription_id = p_sub_id,
    subscription_status = p_status,
    current_period_end = p_period_end,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;


-- 4. PRAYERS TABLE (The Altar)
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'answered', 'archived')) DEFAULT 'active',
    ai_strategy TEXT,
    scripture_ref TEXT,
    prayed_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can insert own prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can update own prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can delete own prayers" ON public.prayers;

CREATE POLICY "Users can view own prayers" ON public.prayers
    FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own prayers" ON public.prayers
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own prayers" ON public.prayers
    FOR UPDATE USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete own prayers" ON public.prayers
    FOR DELETE USING (requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS prayers_user_id_idx ON public.prayers(user_id);


-- 5. SERMONS TABLE (Sermon Studio)
CREATE TABLE IF NOT EXISTS public.sermons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can insert own sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can update own sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can delete own sermons" ON public.sermons;

CREATE POLICY "Users can view own sermons" ON public.sermons
    FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own sermons" ON public.sermons
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own sermons" ON public.sermons
    FOR UPDATE USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete own sermons" ON public.sermons
    FOR DELETE USING (requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS sermons_user_id_idx ON public.sermons(user_id);


-- 6. DAILY RHEMA TABLE
CREATE TABLE IF NOT EXISTS public.daily_rhema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    scripture_text TEXT NOT NULL,
    scripture_ref TEXT NOT NULL,
    content TEXT NOT NULL,
    prayer_focus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_rhema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily rhema" ON public.daily_rhema;
DROP POLICY IF EXISTS "Users can insert own daily rhema" ON public.daily_rhema;

CREATE POLICY "Users can view own daily rhema" ON public.daily_rhema
    FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own daily rhema" ON public.daily_rhema
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);


-- 7. USER STATS (Streaks & Gamification)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    prayer_streak_days INT DEFAULT 0,
    longest_streak_days INT DEFAULT 0,
    last_active_date DATE,
    total_minutes_prayed INT DEFAULT 0,
    total_focus_minutes INT DEFAULT 0
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own stats" ON public.user_stats;
CREATE POLICY "Users can manage own stats" ON public.user_stats
    FOR ALL USING (requesting_user_id() = user_id);

COMMIT;
