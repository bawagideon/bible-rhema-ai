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

CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
    SELECT (
        current_setting('role', true) = 'service_role' OR
        current_setting('request.jwt.claim.role', true) = 'service_role'
    );
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

-- Profiles Policies (Strict Non-Null Owner Access)
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = id)
    WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

-- 4. PRAYERS TABLE & CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_community BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'answered', 'archived')),
    prayed_count INT DEFAULT 0,
    testimony TEXT,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ATOMIC, SECURE PRAYER INTERCESSION RPC FUNCTION
-- Restricted strictly to service_role (invoked via server-side API route)
CREATE OR REPLACE FUNCTION public.increment_prayer_intercession(p_prayer_id UUID, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_community BOOLEAN;
    v_status TEXT;
BEGIN
    -- Only trusted backend services can execute intercession increments
    IF NOT is_service_role() THEN
        RAISE EXCEPTION 'FORBIDDEN: increment_prayer_intercession can only be executed by service_role';
    END IF;

    IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: User ID cannot be null or empty';
    END IF;

    IF p_prayer_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: Prayer ID cannot be null';
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

-- Strict RPC execution permissions: REVOKE from public, anon, and authenticated; GRANT strictly to service_role
REVOKE ALL ON FUNCTION public.increment_prayer_intercession(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prayer_intercession(UUID, TEXT) TO service_role;

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely reconcile duplicates before establishing unique constraint
DELETE FROM public.daily_rhema
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, date) id
    FROM public.daily_rhema
    ORDER BY user_id, date, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_rhema_user_date ON public.daily_rhema(user_id, date);

ALTER TABLE public.daily_rhema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_rhema_select_own" ON public.daily_rhema
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "daily_rhema_insert_own" ON public.daily_rhema
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 9. USER STATS TABLE & ATOMIC STREAK TRANSITIONS
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

-- CONCURRENCY-SAFE ATOMIC USER ACTIVITY RPC
CREATE OR REPLACE FUNCTION public.record_atomic_user_activity(p_user_id TEXT, p_today DATE DEFAULT NULL)
RETURNS TABLE (prayer_streak_days INT, longest_streak_days INT, last_active_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stats public.user_stats%ROWTYPE;
    v_today DATE := COALESCE(p_today, CURRENT_DATE);
    v_diff INT;
    v_new_streak INT;
    v_new_longest INT;
BEGIN
    IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: User ID cannot be null or empty';
    END IF;

    -- Restricted strictly to service_role (called from server-side activity tracker)
    IF NOT is_service_role() THEN
        RAISE EXCEPTION 'FORBIDDEN: record_atomic_user_activity can only be executed by service_role';
    END IF;

    SELECT * INTO v_stats
    FROM public.user_stats
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.user_stats (
            user_id, prayer_streak_days, longest_streak_days, last_active_date
        ) VALUES (
            p_user_id, 1, 1, v_today
        )
        RETURNING * INTO v_stats;

        RETURN QUERY SELECT v_stats.prayer_streak_days, v_stats.longest_streak_days, v_stats.last_active_date;
        RETURN;
    END IF;

    IF v_stats.last_active_date = v_today THEN
        RETURN QUERY SELECT v_stats.prayer_streak_days, v_stats.longest_streak_days, v_stats.last_active_date;
        RETURN;
    END IF;

    v_diff := v_today - v_stats.last_active_date;

    IF v_diff = 1 THEN
        v_new_streak := COALESCE(v_stats.prayer_streak_days, 0) + 1;
    ELSE
        v_new_streak := 1;
    END IF;

    v_new_longest := GREATEST(COALESCE(v_stats.longest_streak_days, 0), v_new_streak);

    UPDATE public.user_stats
    SET
        prayer_streak_days = v_new_streak,
        longest_streak_days = v_new_longest,
        last_active_date = v_today
    WHERE user_id = p_user_id
    RETURNING * INTO v_stats;

    RETURN QUERY SELECT v_stats.prayer_streak_days, v_stats.longest_streak_days, v_stats.last_active_date;
END;
$$;

REVOKE ALL ON FUNCTION public.record_atomic_user_activity(TEXT, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_atomic_user_activity(TEXT, DATE) TO service_role;

-- 10. PAYMENT TRANSACTIONS AUDIT TABLE & ATOMIC FULFILLMENT
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_kobo BIGINT NOT NULL,
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

-- ATOMIC, REPLAY-PROTECTED SUBSCRIPTION PAYMENT FULFILLMENT RPC
CREATE OR REPLACE FUNCTION public.fulfill_subscription_payment(
    p_reference TEXT,
    p_user_id TEXT,
    p_tier TEXT,
    p_billing_cycle TEXT,
    p_amount_kobo BIGINT,
    p_currency TEXT,
    p_customer_code TEXT,
    p_period_end TIMESTAMPTZ,
    p_response_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tx public.payment_transactions%ROWTYPE;
BEGIN
    IF NOT is_service_role() THEN
        RAISE EXCEPTION 'FORBIDDEN: fulfill_subscription_payment can only be executed by service_role';
    END IF;

    -- Strict input validation
    IF p_reference IS NULL OR trim(p_reference) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: Payment reference cannot be null or empty';
    END IF;

    IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: User ID cannot be null or empty';
    END IF;

    IF p_tier NOT IN ('DISCIPLE', 'MINISTER') THEN
        RAISE EXCEPTION 'INVALID_TIER: Permitted tiers are DISCIPLE or MINISTER, received %', p_tier;
    END IF;

    IF p_billing_cycle NOT IN ('monthly', 'yearly') THEN
        RAISE EXCEPTION 'INVALID_CYCLE: Permitted billing cycles are monthly or yearly, received %', p_billing_cycle;
    END IF;

    IF p_amount_kobo IS NULL OR p_amount_kobo <= 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT: Payment amount in kobo must be positive, received %', p_amount_kobo;
    END IF;

    -- Advisory lock serializes concurrent attempts on this exact payment reference
    PERFORM pg_advisory_xact_lock(hashtext('paystack_ref_' || p_reference));

    SELECT * INTO v_tx
    FROM public.payment_transactions
    WHERE reference = p_reference
    FOR UPDATE;

    IF FOUND THEN
        IF v_tx.user_id <> p_user_id THEN
            RAISE EXCEPTION 'USER_MISMATCH: Reference % already registered to a different user', p_reference;
        END IF;

        IF v_tx.status = 'fulfilled' THEN
            RETURN jsonb_build_object(
                'success', true,
                'already_fulfilled', true,
                'tier', v_tx.plan,
                'cycle', v_tx.cycle,
                'reference', p_reference
            );
        END IF;
    END IF;

    -- Upsert transaction record into audit ledger
    INSERT INTO public.payment_transactions (
        reference, user_id, amount_kobo, currency, plan, cycle, status, fulfilled_at, paystack_response_json
    ) VALUES (
        p_reference, p_user_id, p_amount_kobo, p_currency, p_tier, p_billing_cycle, 'fulfilled', NOW(), p_response_json
    ) ON CONFLICT (reference) DO UPDATE SET
        status = 'fulfilled',
        fulfilled_at = NOW(),
        paystack_response_json = EXCLUDED.paystack_response_json;

    -- Atomically update or create profile entitlement
    UPDATE public.profiles
    SET
        tier = p_tier,
        paystack_customer_code = COALESCE(p_customer_code, paystack_customer_code),
        paystack_reference = p_reference,
        subscription_status = 'active',
        current_period_end = p_period_end,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.profiles (
            id, tier, paystack_customer_code, paystack_reference, subscription_status, current_period_end, updated_at
        ) VALUES (
            p_user_id, p_tier, p_customer_code, p_reference, 'active', p_period_end, NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_fulfilled', false,
        'tier', p_tier,
        'cycle', p_billing_cycle,
        'reference', p_reference,
        'period_end', p_period_end
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_subscription_payment FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_subscription_payment TO service_role;

-- 11. VECTOR DOCUMENTS TABLE ACCESS HARDENING (Explicit Canonical Distinction)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "documents_select_scoped" ON public.documents
            FOR SELECT USING (is_canonical = TRUE OR (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id));

        CREATE POLICY "documents_manage_own" ON public.documents
            FOR ALL USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);
    END IF;
END $$;

-- 12. USER DAILY USAGE & QUOTA ENFORCEMENT
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    query_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_daily_usage_own" ON public.user_daily_usage
    FOR ALL USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE TABLE IF NOT EXISTS public.user_quota_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'refunded', 'consumed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_quota_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_quota_reservations_own" ON public.user_quota_reservations
    FOR ALL USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- ATOMIC, CONCURRENCY-SAFE QUOTA RESERVATION RPC (Returns unique reservation_id)
CREATE OR REPLACE FUNCTION public.reserve_query_quota(
    p_user_id TEXT,
    p_limit INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_current_count INT;
    v_reservation_id UUID;
BEGIN
    IF NOT is_service_role() THEN
        RAISE EXCEPTION 'FORBIDDEN: reserve_query_quota can only be executed by service_role';
    END IF;

    IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: User ID cannot be null or empty';
    END IF;

    -- Ensure row exists for today
    INSERT INTO public.user_daily_usage (user_id, usage_date, query_count)
    VALUES (p_user_id, v_today, 0)
    ON CONFLICT (user_id, usage_date) DO NOTHING;

    -- Serialize concurrent reservation attempts using row-level lock
    SELECT query_count INTO v_current_count
    FROM public.user_daily_usage
    WHERE user_id = p_user_id AND usage_date = v_today
    FOR UPDATE;

    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

    -- Quota check: if limit > 0 and count has already reached limit
    IF p_limit > 0 AND v_current_count >= p_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'count', v_current_count,
            'limit', p_limit
        );
    END IF;

    -- Generate unique reservation ID and record active reservation in ledger
    v_reservation_id := gen_random_uuid();
    INSERT INTO public.user_quota_reservations (id, user_id, usage_date, status)
    VALUES (v_reservation_id, p_user_id, v_today, 'active');

    -- Atomically increment and reserve slot
    UPDATE public.user_daily_usage
    SET query_count = query_count + 1
    WHERE user_id = p_user_id AND usage_date = v_today
    RETURNING query_count INTO v_current_count;

    RETURN jsonb_build_object(
        'allowed', true,
        'count', v_current_count,
        'limit', p_limit,
        'reservation_id', v_reservation_id
    );
END;
$$;

-- ATOMIC, IDEMPOTENT QUOTA REFUND RPC (Protected against concurrent undo races)
CREATE OR REPLACE FUNCTION public.refund_query_quota(
    p_user_id TEXT,
    p_reservation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_res public.user_quota_reservations%ROWTYPE;
    v_count INT;
BEGIN
    IF NOT is_service_role() THEN
        RAISE EXCEPTION 'FORBIDDEN: refund_query_quota can only be executed by service_role';
    END IF;

    IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
        RETURN jsonb_build_object('refunded', false, 'reason', 'invalid_user');
    END IF;

    -- If a specific reservation ID is provided, verify it is active and belongs to user
    IF p_reservation_id IS NOT NULL THEN
        SELECT * INTO v_res
        FROM public.user_quota_reservations
        WHERE id = p_reservation_id AND user_id = p_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            -- Reservation does not exist or doesn't belong to this user
            RETURN jsonb_build_object('refunded', false, 'reason', 'reservation_not_found');
        END IF;

        IF v_res.status <> 'active' THEN
            -- Already refunded or consumed; idempotent return without double-decrementing
            RETURN jsonb_build_object('refunded', false, 'already_processed', true, 'status', v_res.status);
        END IF;

        -- Mark reservation as refunded
        UPDATE public.user_quota_reservations
        SET status = 'refunded', updated_at = NOW()
        WHERE id = p_reservation_id;
    END IF;

    -- Atomically decrement usage counter
    UPDATE public.user_daily_usage
    SET query_count = GREATEST(0, query_count - 1)
    WHERE user_id = p_user_id AND usage_date = v_today
    RETURNING query_count INTO v_count;

    RETURN jsonb_build_object(
        'refunded', true,
        'reservation_id', p_reservation_id,
        'current_count', COALESCE(v_count, 0)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_query_quota(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_query_quota(TEXT, INT) TO service_role;

REVOKE ALL ON FUNCTION public.refund_query_quota(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_query_quota(TEXT, UUID) TO service_role;

-- 13. COMPREHENSIVE SQL PRIVILEGES RECONCILIATION
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.prayers TO anon; -- anon can read public community prayers under RLS is_community = true
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

COMMIT;
