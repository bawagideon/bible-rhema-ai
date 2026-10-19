-- ==============================================================================
-- BIBLE RHEMA AI - PRAYER MODERATION REPORTS & DURABLE AUDIT LOGS
-- Provides durable moderation records, reporter tracking, and review status
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.prayer_moderation_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
    reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT
);

ALTER TABLE public.prayer_moderation_reports ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
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

COMMIT;
