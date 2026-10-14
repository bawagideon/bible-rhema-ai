-- ==============================================================================
-- BIBLE RHEMA AI - SECURITY PATCH: RPC PRIVILEGES & DEFINER ISOLATION
-- Run this in your Supabase SQL Editor to instantly apply the latest hardening.
-- ==============================================================================

BEGIN;

-- 1. CLERK AUTH & SERVICE ROLE IDENTIFIERS
-- Eliminates definer privilege leakage and boolean coalesce bug
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
    SELECT (
        current_setting('role', true) = 'service_role' OR
        current_setting('request.jwt.claim.role', true) = 'service_role'
    );
$$ LANGUAGE SQL STABLE;

-- 2. PRAYER INTERCESSION RPC (Strictly service_role)
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

REVOKE ALL ON FUNCTION public.increment_prayer_intercession(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prayer_intercession(UUID, TEXT) TO service_role;

-- 3. USER ACTIVITY RECORDER RPC (Strictly service_role)
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
    IF NOT is_service_role() THEN
        RAISE EXCEPTION 'FORBIDDEN: record_atomic_user_activity can only be executed by service_role';
    END IF;

    IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: User ID cannot be null or empty';
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

-- 4. PAYMENT FULFILLMENT RPC (Strictly service_role)
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

    INSERT INTO public.payment_transactions (
        reference, user_id, amount_kobo, currency, plan, cycle, status, fulfilled_at, paystack_response_json
    ) VALUES (
        p_reference, p_user_id, p_amount_kobo, p_currency, p_tier, p_billing_cycle, 'fulfilled', NOW(), p_response_json
    ) ON CONFLICT (reference) DO UPDATE SET
        status = 'fulfilled',
        fulfilled_at = NOW(),
        paystack_response_json = EXCLUDED.paystack_response_json;

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

-- 5. DAILY QUOTA RESERVATION & REFUND WITH CONCURRENCY-SAFE IDEMPOTENT LEDGER
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

    INSERT INTO public.user_daily_usage (user_id, usage_date, query_count)
    VALUES (p_user_id, v_today, 0)
    ON CONFLICT (user_id, usage_date) DO NOTHING;

    SELECT query_count INTO v_current_count
    FROM public.user_daily_usage
    WHERE user_id = p_user_id AND usage_date = v_today
    FOR UPDATE;

    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

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

-- ATOMIC, IDEMPOTENT QUOTA REFUND RPC
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
            RETURN jsonb_build_object('refunded', false, 'reason', 'reservation_not_found');
        END IF;

        IF v_res.status <> 'active' THEN
            RETURN jsonb_build_object('refunded', false, 'already_processed', true, 'status', v_res.status);
        END IF;

        UPDATE public.user_quota_reservations
        SET status = 'refunded', updated_at = NOW()
        WHERE id = p_reservation_id;
    END IF;

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

COMMIT;
