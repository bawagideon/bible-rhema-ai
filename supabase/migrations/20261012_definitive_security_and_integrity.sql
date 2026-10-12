-- ==============================================================================
-- BIBLE RHEMA AI - DEFINITIVE SECURITY, INTEGRITY & RLS CONSOLIDATION MIGRATION
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Paste & Run
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

-- 2. DYNAMIC PURGE OF ALL LEGACY RLS POLICIES ON APPLICATION TABLES
-- Eliminates any possibility of surviving permissive OR policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'profiles',
              'prayers',
              'sermons',
              'daily_rhema',
              'user_stats',
              'journal_entries',
              'saved_studies',
              'documents',
              'prayer_intercessions',
              'payment_transactions'
          )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. PROFILES TABLE RECONCILIATION & CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'SEEKER',
    paystack_customer_code TEXT,
    paystack_subscription_code TEXT,
    paystack_reference TEXT,
    paystack_plan_code TEXT,
    subscription_status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    preferred_bible_version TEXT DEFAULT 'ESV',
    spiritual_goals TEXT[] DEFAULT '{}',
    struggles TEXT[] DEFAULT '{}',
    favorite_ministers TEXT[] DEFAULT '{}',
    denominational_bias TEXT,
    has_completed_onboarding BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'SEEKER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_bible_version TEXT DEFAULT 'ESV';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_goals TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS struggles TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_ministers TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Reconcile legacy GUEST tiers to SEEKER
UPDATE public.profiles
SET tier = 'SEEKER'
WHERE tier IS NULL OR tier NOT IN ('SEEKER', 'DISCIPLE', 'MINISTER');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('SEEKER', 'DISCIPLE', 'MINISTER'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

-- 4. PRAYERS TABLE & INTERCESSION JOIN TABLE
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('active', 'answered', 'archived')) DEFAULT 'active',
    is_community BOOLEAN DEFAULT false,
    author_name TEXT,
    ai_strategy TEXT,
    scripture_ref TEXT,
    prayed_count INT DEFAULT 0,
    testimony TEXT,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS is_community BOOLEAN DEFAULT false;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS testimony TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prayers_select" ON public.prayers
    FOR SELECT USING (is_community = TRUE OR (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id));

CREATE POLICY "prayers_insert" ON public.prayers
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "prayers_update" ON public.prayers
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "prayers_delete" ON public.prayers
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS prayers_user_id_idx ON public.prayers(user_id);
CREATE INDEX IF NOT EXISTS prayers_community_idx ON public.prayers(is_community, created_at DESC);

-- PRAYER INTERCESSIONS JOIN TABLE (Normalized, Concurrency-Safe)
CREATE TABLE IF NOT EXISTS public.prayer_intercessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_prayer_user_intercession UNIQUE (prayer_id, user_id)
);

ALTER TABLE public.prayer_intercessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prayer_intercessions_select_own" ON public.prayer_intercessions
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "prayer_intercessions_insert_own" ON public.prayer_intercessions
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- ATOMIC, AUTHORIZED PRAYER INTERCESSION RPC FUNCTION
CREATE OR REPLACE FUNCTION increment_prayer_intercession(p_prayer_id UUID, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_community BOOLEAN;
    v_status TEXT;
    v_caller TEXT;
BEGIN
    v_caller := requesting_user_id();
    IF v_caller IS NOT NULL AND v_caller <> p_user_id THEN
        RAISE EXCEPTION 'Caller ID does not match target user ID';
    END IF;

    SELECT is_community, status INTO v_is_community, v_status
    FROM public.prayers
    WHERE id = p_prayer_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_is_community IS NOT TRUE OR v_status <> 'active' THEN
        RETURN FALSE;
    END IF;

    BEGIN
        INSERT INTO public.prayer_intercessions (prayer_id, user_id)
        VALUES (p_prayer_id, p_user_id);
    EXCEPTION WHEN unique_violation THEN
        RETURN FALSE;
    END;

    UPDATE public.prayers
    SET prayed_count = COALESCE(prayed_count, 0) + 1
    WHERE id = p_prayer_id;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION increment_prayer_intercession(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_prayer_intercession(UUID, TEXT) TO authenticated, service_role, anon;

-- 5. SERMONS TABLE
CREATE TABLE IF NOT EXISTS public.sermons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sermons_select_own" ON public.sermons
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "sermons_insert_own" ON public.sermons
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "sermons_update_own" ON public.sermons
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "sermons_delete_own" ON public.sermons
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS sermons_user_id_idx ON public.sermons(user_id);

-- 6. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    scripture_ref TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_select_own" ON public.journal_entries
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "journal_insert_own" ON public.journal_entries
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "journal_update_own" ON public.journal_entries
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "journal_delete_own" ON public.journal_entries
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS journal_user_id_idx ON public.journal_entries(user_id);

-- 7. SAVED STUDIES TABLE
CREATE TABLE IF NOT EXISTS public.saved_studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    mode TEXT NOT NULL,
    query TEXT,
    content TEXT NOT NULL,
    scripture_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studies_select_own" ON public.saved_studies
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "studies_insert_own" ON public.saved_studies
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "studies_update_own" ON public.saved_studies
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "studies_delete_own" ON public.saved_studies
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS studies_user_id_idx ON public.saved_studies(user_id);

-- 8. DAILY RHEMA TABLE
CREATE TABLE IF NOT EXISTS public.daily_rhema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    scripture_text TEXT NOT NULL,
    scripture_ref TEXT NOT NULL,
    content TEXT NOT NULL,
    prayer_focus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT daily_rhema_user_date_unique UNIQUE (user_id, date)
);

ALTER TABLE public.daily_rhema DROP CONSTRAINT IF EXISTS daily_rhema_user_date_unique;
ALTER TABLE public.daily_rhema ADD CONSTRAINT daily_rhema_user_date_unique UNIQUE (user_id, date);

ALTER TABLE public.daily_rhema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_rhema_select_own" ON public.daily_rhema
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "daily_rhema_insert_own" ON public.daily_rhema
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 9. USER STATS TABLE
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    prayer_streak_days INT DEFAULT 0,
    longest_streak_days INT DEFAULT 0,
    last_active_date DATE,
    total_minutes_prayed INT DEFAULT 0,
    total_focus_minutes INT DEFAULT 0
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_stats_select_own" ON public.user_stats
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "user_stats_insert_own" ON public.user_stats
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "user_stats_update_own" ON public.user_stats
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 10. PAYMENT TRANSACTIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_kobo INT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    plan TEXT NOT NULL,
    cycle TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    fulfilled_at TIMESTAMPTZ,
    paystack_response_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_tx_select_own" ON public.payment_transactions
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 11. VECTOR DOCUMENTS TABLE ACCESS HARDENING
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE;
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "documents_select_scoped" ON public.documents
            FOR SELECT USING (user_id IS NULL OR (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id));

        CREATE POLICY "documents_manage_own" ON public.documents
            FOR ALL USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);
    END IF;
END $$;

COMMIT;
