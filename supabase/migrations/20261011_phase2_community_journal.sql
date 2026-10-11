-- ==============================================================================
-- BIBLE RHEMA AI - PHASE 2 MIGRATION: COMMUNITY PRAYERS, JOURNAL & SAVED STUDIES
-- Paste into Supabase SQL Editor and run once
-- ==============================================================================

BEGIN;

-- 1. COMMUNITY PRAYER EXPANSION
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS is_community BOOLEAN DEFAULT FALSE;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Anonymous Believer';
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS intercessors TEXT[] DEFAULT '{}';
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS testimony TEXT;

-- Community prayers read policy: anyone can read prayers marked is_community = true, or authenticated users can read their own
DROP POLICY IF EXISTS "Community prayers are viewable by all" ON public.prayers;
CREATE POLICY "Community prayers are viewable by all" ON public.prayers
    FOR SELECT USING (is_community = TRUE OR (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id));

-- 2. JOURNAL ENTRIES TABLE
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

CREATE INDEX IF NOT EXISTS journal_user_id_idx ON public.journal_entries(user_id);

-- 3. SAVED STUDIES TABLE (SpiritOS Studies in Library)
CREATE TABLE IF NOT EXISTS public.saved_studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'exegesis',
    query TEXT NOT NULL,
    content TEXT NOT NULL,
    scripture_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS studies_user_id_idx ON public.saved_studies(user_id);

COMMIT;
