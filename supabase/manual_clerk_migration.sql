-- MANUAL MIGRATION SCRIPT
-- RUN THIS IN SUPABASE DASHBOARD > SQL EDITOR

BEGIN;

-- 1. DROP FOREIGN KEYS (Decoupling from auth.users)
-- We try multiple common names to be safe. Errors here are fine if constraint doesn't exist.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE daily_rhema DROP CONSTRAINT IF EXISTS daily_rhema_user_id_fkey;
ALTER TABLE prayers DROP CONSTRAINT IF EXISTS prayers_user_id_fkey;
ALTER TABLE sermons DROP CONSTRAINT IF EXISTS sermons_user_id_fkey;

-- 2. CHANGE TYPES TO TEXT (For Clerk IDs)
ALTER TABLE profiles ALTER COLUMN id TYPE text;
ALTER TABLE daily_rhema ALTER COLUMN user_id TYPE text;

-- (Only run these if tables exist - The SQL Editor handles errors or you can wrap in DO block)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prayers') THEN
        ALTER TABLE prayers ALTER COLUMN user_id TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sermons') THEN
        ALTER TABLE sermons ALTER COLUMN user_id TYPE text;
    END IF;
END $$;

-- 3. RESTORE INTERNAL FOREIGN KEYS (Content -> Profile)
ALTER TABLE daily_rhema ADD CONSTRAINT daily_rhema_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prayers') THEN
         ALTER TABLE prayers DROP CONSTRAINT IF EXISTS prayers_user_id_fkey; -- ensure specific name
         ALTER TABLE prayers ADD CONSTRAINT prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sermons') THEN
         ALTER TABLE sermons DROP CONSTRAINT IF EXISTS sermons_user_id_fkey; -- ensure specific name
         ALTER TABLE sermons ADD CONSTRAINT sermons_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. RLS HELPER (The Bridge)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT (auth.jwt() ->> 'sub');
$$ LANGUAGE sql STABLE;

-- 5. UPDATE RLS POLICIES (Profiles)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (requesting_user_id() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (requesting_user_id() = id);

-- 6. UPDATE RLS POLICIES (Daily Rhema)
DROP POLICY IF EXISTS "Users can view their own daily rhema" ON daily_rhema;
DROP POLICY IF EXISTS "Users can insert their own daily rhema" ON daily_rhema;

CREATE POLICY "Users can view their own daily rhema" ON daily_rhema FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Users can insert their own daily rhema" ON daily_rhema FOR INSERT WITH CHECK (requesting_user_id() = user_id);

-- 7. UPDATE RLS POLICIES (Prayers/Sermons - Generic)
-- We assume standard policy names or just add new ones. 
-- PLEASE VERIFY EXISTING POLICIES FOR SERMONS/PRAYERS MANUALLY IF NEEDED.

COMMIT;
