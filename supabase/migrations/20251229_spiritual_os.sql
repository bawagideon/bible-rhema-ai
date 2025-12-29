-- SPIRITUAL OS MIGRATION (Phase 20)

-- 1. NOVENAS (Feature #2)
CREATE TABLE IF NOT EXISTS public.novenas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk ID
    title TEXT NOT NULL, -- e.g. "Job Search", "Peace in Family"
    start_date TIMESTAMPTZ DEFAULT NOW(),
    duration_days INTEGER NOT NULL CHECK (duration_days IN (3, 7, 9, 21)),
    current_day INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
    last_checked_in_at TIMESTAMPTZ
);

ALTER TABLE public.novenas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'novenas' AND policyname = 'Users can view their own novenas') THEN
        CREATE POLICY "Users can view their own novenas" ON public.novenas FOR SELECT USING (requesting_user_id() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'novenas' AND policyname = 'Users can insert their own novenas') THEN
        CREATE POLICY "Users can insert their own novenas" ON public.novenas FOR INSERT WITH CHECK (requesting_user_id() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'novenas' AND policyname = 'Users can update their own novenas') THEN
        CREATE POLICY "Users can update their own novenas" ON public.novenas FOR UPDATE USING (requesting_user_id() = user_id);
    END IF;
END
$$;

-- 2. USER STATS (Feature #12 - "Walk with God Streak")
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id TEXT PRIMARY KEY, -- Clerk ID
    prayer_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_active_date DATE, -- Just the date part for streak calculation
    total_minutes_prayed INTEGER DEFAULT 0,
    total_focus_minutes INTEGER DEFAULT 0
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can view their own stats') THEN
        CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT USING (requesting_user_id() = user_id);
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can update their own stats') THEN
        CREATE POLICY "Users can update their own stats" ON public.user_stats FOR ALL USING (requesting_user_id() = user_id);
    END IF;
END
$$;


-- 3. FOCUS SESSIONS (Feature #10 - "Nehemiah Mode")
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    type TEXT CHECK (type IN ('worship', 'study', 'work')) DEFAULT 'work',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can view their own sessions') THEN
        CREATE POLICY "Users can view their own sessions" ON public.focus_sessions FOR SELECT USING (requesting_user_id() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can insert their own sessions') THEN
        CREATE POLICY "Users can insert their own sessions" ON public.focus_sessions FOR INSERT WITH CHECK (requesting_user_id() = user_id);
    END IF;
END
$$;


-- 4. JOURNAL ENTRIES (Feature #7 - "Emotional Triage")
-- Creating the table fresh if it doesn't exist
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT,
    mood_tag TEXT, -- e.g. 'Anxious', 'Joyful'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can view their own journal') THEN
        CREATE POLICY "Users can view their own journal" ON public.journal_entries FOR SELECT USING (requesting_user_id() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can insert their own journal') THEN
        CREATE POLICY "Users can insert their own journal" ON public.journal_entries FOR INSERT WITH CHECK (requesting_user_id() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can update their own journal') THEN
        CREATE POLICY "Users can update their own journal" ON public.journal_entries FOR UPDATE USING (requesting_user_id() = user_id);
    END IF;
END
$$;

-- INDEXES
CREATE INDEX IF NOT EXISTS novenas_user_id_idx ON public.novenas(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS journal_user_id_idx ON public.journal_entries(user_id);
