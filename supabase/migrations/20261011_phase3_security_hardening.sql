-- ==============================================================================
-- BIBLE RHEMA AI - PHASE 3 SECURITY HARDENING MIGRATION
-- Run in Supabase SQL Editor to close all anonymous access bypasses
-- ==============================================================================

BEGIN;

-- 1. SECURE PRAYERS TABLE
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community prayers are viewable by all" ON public.prayers;
DROP POLICY IF EXISTS "Users can view own prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can insert own prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can update own prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can delete own prayers" ON public.prayers;

-- Public can only view prayers explicitly designated as community prayers
CREATE POLICY "Community prayers are viewable by all" ON public.prayers
    FOR SELECT USING (is_community = TRUE OR (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id));

CREATE POLICY "Users can insert own prayers" ON public.prayers
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can update own prayers" ON public.prayers
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can delete own prayers" ON public.prayers
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 2. SECURE JOURNAL ENTRIES TABLE
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own journals" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journals" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journals" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journals" ON public.journal_entries;

CREATE POLICY "Users can view own journals" ON public.journal_entries
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can insert own journals" ON public.journal_entries
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can update own journals" ON public.journal_entries
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can delete own journals" ON public.journal_entries
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 3. SECURE SAVED STUDIES TABLE
ALTER TABLE public.saved_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own studies" ON public.saved_studies;
DROP POLICY IF EXISTS "Users can insert own studies" ON public.saved_studies;
DROP POLICY IF EXISTS "Users can delete own studies" ON public.saved_studies;

CREATE POLICY "Users can view own studies" ON public.saved_studies
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can insert own studies" ON public.saved_studies
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can delete own studies" ON public.saved_studies
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 4. SECURE SERMONS TABLE
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can insert own sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can update own sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can delete own sermons" ON public.sermons;

CREATE POLICY "Users can view own sermons" ON public.sermons
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can insert own sermons" ON public.sermons
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can update own sermons" ON public.sermons
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can delete own sermons" ON public.sermons
    FOR DELETE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 5. SECURE PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = id);

-- 6. SECURE USER STATS TABLE
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;

CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR SELECT USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can insert own stats" ON public.user_stats
    FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_stats
    FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- 7. REVOKE PUBLIC EXECUTE PRIVILEGES ON SECURITY DEFINER SUBSCRIPTION FUNCTION
REVOKE EXECUTE ON FUNCTION public.update_subscription_status(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM public, anon, authenticated;

COMMIT;
