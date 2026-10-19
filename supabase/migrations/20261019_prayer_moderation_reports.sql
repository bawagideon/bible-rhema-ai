-- ==============================================================================
-- BIBLE RHEMA AI - DURABLE PRAYER MODERATION & AUDIT LOGGING MIGRATION
-- Provides atomic reporting, durable audit records surviving content deletion,
-- duplicate report protection, and defined moderation workflow statuses.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.prayer_moderation_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Non-destructive foreign keys: audit log survives prayer or user account deletion
    prayer_id UUID REFERENCES public.prayers(id) ON DELETE SET NULL,
    reporter_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_review'
        CONSTRAINT valid_moderation_status CHECK (status IN ('pending_review', 'under_review', 'actioned', 'dismissed', 'restored')),
    -- Snapshot fields to preserve audit evidence even after parent content deletion
    prayer_title_snapshot TEXT,
    reported_user_id_snapshot TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    -- Abuse protection: prevents duplicate report spam from the same reporter
    CONSTRAINT unique_reporter_per_prayer UNIQUE (prayer_id, reporter_id)
);

ALTER TABLE public.prayer_moderation_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert moderation reports" ON public.prayer_moderation_reports;
DROP POLICY IF EXISTS "Service role manages moderation reports" ON public.prayer_moderation_reports;

-- Authenticated users can submit reports for community prayers
CREATE POLICY "Users can insert moderation reports" ON public.prayer_moderation_reports
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = reporter_id);

-- Service role has full administrative access
CREATE POLICY "Service role manages moderation reports" ON public.prayer_moderation_reports
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS prayer_reports_prayer_id_idx ON public.prayer_moderation_reports(prayer_id);
CREATE INDEX IF NOT EXISTS prayer_reports_status_idx ON public.prayer_moderation_reports(status);
CREATE INDEX IF NOT EXISTS prayer_reports_reporter_id_idx ON public.prayer_moderation_reports(reporter_id);

-- ==============================================================================
-- ATOMIC STORED PROCEDURE: report_community_prayer
-- Executes validation, audit report creation, and prayer unpublishing
-- inside a single database transaction with row-level locking.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.report_community_prayer(
    p_prayer_id UUID,
    p_reporter_id TEXT,
    p_reason TEXT DEFAULT 'Community flag'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prayer RECORD;
    v_report_id UUID;
BEGIN
    -- Enforce service_role execution boundary to prevent client-side reporter spoofing
    IF current_setting('role', true) <> 'service_role' AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN: report_community_prayer can only be executed by service_role';
    END IF;

    IF p_prayer_id IS NULL OR p_reporter_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_PARAMS: prayer_id and reporter_id are required.';
    END IF;

    -- Row lock target prayer to prevent concurrent race conditions
    SELECT id, user_id, title, is_community
    INTO v_prayer
    FROM public.prayers
    WHERE id = p_prayer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Petition does not exist.';
    END IF;

    IF NOT v_prayer.is_community THEN
        RAISE EXCEPTION 'NOT_PUBLIC: Only active public community petitions can be reported.';
    END IF;

    IF v_prayer.user_id = p_reporter_id THEN
        RAISE EXCEPTION 'SELF_REPORT: Authors cannot report their own petitions.';
    END IF;

    -- Insert durable moderation record with audit snapshots
    INSERT INTO public.prayer_moderation_reports (
        prayer_id,
        reporter_id,
        reason,
        status,
        prayer_title_snapshot,
        reported_user_id_snapshot
    ) VALUES (
        p_prayer_id,
        p_reporter_id,
        COALESCE(NULLIF(TRIM(p_reason), ''), 'Community flag'),
        'pending_review',
        v_prayer.title,
        v_prayer.user_id
    )
    ON CONFLICT (prayer_id, reporter_id) DO NOTHING
    RETURNING id INTO v_report_id;

    IF v_report_id IS NULL THEN
        RAISE EXCEPTION 'DUPLICATE_REPORT: You have already submitted a report for this petition.';
    END IF;

    -- Atomically unpublish from community wall
    UPDATE public.prayers
    SET is_community = false
    WHERE id = p_prayer_id;

    RETURN jsonb_build_object(
        'success', true,
        'report_id', v_report_id,
        'prayer_id', p_prayer_id,
        'status', 'pending_review',
        'message', 'Petition reported and unpublished for moderation review.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.report_community_prayer(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_community_prayer(UUID, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.report_community_prayer(UUID, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.report_community_prayer(UUID, TEXT, TEXT) TO service_role;

COMMIT;
