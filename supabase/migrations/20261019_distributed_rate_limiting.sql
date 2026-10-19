-- ==============================================================================
-- BIBLE RHEMA AI - DISTRIBUTED RATE LIMITING
-- Shared atomic token/window store across serverless function instances
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
    bucket_key TEXT PRIMARY KEY,
    count INT NOT NULL DEFAULT 1,
    reset_at BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limit_buckets;
CREATE POLICY "Service role manages rate limits" ON public.rate_limit_buckets
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx ON public.rate_limit_buckets(reset_at);

-- ==============================================================================
-- ATOMIC STORED PROCEDURE: check_rate_limit
-- Evaluates and increments sliding-window request counters atomically
-- under row-level locks, preventing serverless instance race conditions.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_window_ms BIGINT DEFAULT 60000,
    p_max_requests INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now BIGINT := FLOOR(EXTRACT(EPOCH FROM CLOCK_TIMESTAMP()) * 1000);
    v_reset_at BIGINT;
    v_count INT;
    v_allowed BOOLEAN;
BEGIN
    -- Input sanitization
    IF p_key IS NULL OR LENGTH(TRIM(p_key)) = 0 THEN
        p_key := 'anonymous_client';
    END IF;
    p_key := SUBSTRING(p_key FROM 1 FOR 256);

    -- Prune expired buckets occasionally (1% of transactions)
    IF RANDOM() < 0.01 THEN
        DELETE FROM public.rate_limit_buckets WHERE reset_at < (v_now - 300000);
    END IF;

    -- Row-lock the specific rate limit bucket
    SELECT reset_at, count INTO v_reset_at, v_count
    FROM public.rate_limit_buckets
    WHERE bucket_key = p_key
    FOR UPDATE;

    IF NOT FOUND OR v_now >= v_reset_at THEN
        v_reset_at := v_now + p_window_ms;
        v_count := 1;
        v_allowed := TRUE;
        INSERT INTO public.rate_limit_buckets (bucket_key, count, reset_at, updated_at)
        VALUES (p_key, v_count, v_reset_at, NOW())
        ON CONFLICT (bucket_key)
        DO UPDATE SET count = v_count, reset_at = v_reset_at, updated_at = NOW();
    ELSIF v_count < p_max_requests THEN
        v_count := v_count + 1;
        v_allowed := TRUE;
        UPDATE public.rate_limit_buckets
        SET count = v_count, updated_at = NOW()
        WHERE bucket_key = p_key;
    ELSE
        v_allowed := FALSE;
    END IF;

    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'count', v_count,
        'max_requests', p_max_requests,
        'remaining', GREATEST(0, p_max_requests - v_count),
        'reset_at', v_reset_at,
        'retry_after_seconds', GREATEST(1, CEIL((v_reset_at - v_now) / 1000.0))
    );
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;

COMMIT;
