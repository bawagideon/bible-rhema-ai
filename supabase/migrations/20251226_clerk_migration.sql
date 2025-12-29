-- Migration: Clerk Authentication Support
-- Description: Decouple from Supabase Auth (UUID) and support Clerk (String/Text IDs)

BEGIN;

-- 1. Drop constraints referencing auth.users (UUID)
-- We use DO blocks to avoid errors if constraints don't exist or have different names
DO $$ 
BEGIN
    -- Profiles
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_fkey') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
    
    -- Daily Rhema
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'daily_rhema_user_id_fkey') THEN
        ALTER TABLE daily_rhema DROP CONSTRAINT daily_rhema_user_id_fkey;
    END IF;

    -- Prayers (If exists)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'prayers_user_id_fkey') THEN
        ALTER TABLE prayers DROP CONSTRAINT prayers_user_id_fkey;
    END IF;

    -- Sermons (If exists)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sermons_user_id_fkey') THEN
        ALTER TABLE sermons DROP CONSTRAINT sermons_user_id_fkey;
    END IF;
END $$;

-- 2. Alter User ID Columns to TEXT (to store Clerk 'user_2b...' IDs)
ALTER TABLE profiles ALTER COLUMN id TYPE text;
ALTER TABLE daily_rhema ALTER COLUMN user_id TYPE text;

-- Check and alter other tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prayers') THEN
        ALTER TABLE prayers ALTER COLUMN user_id TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sermons') THEN
        ALTER TABLE sermons ALTER COLUMN user_id TYPE text;
    END IF;
END $$;

-- 3. Re-establish relations (Content -> Profile)
-- Now that both are TEXT, we can relink them.
ALTER TABLE daily_rhema ADD CONSTRAINT daily_rhema_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prayers') THEN
        ALTER TABLE prayers ADD CONSTRAINT prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sermons') THEN
        ALTER TABLE sermons ADD CONSTRAINT sermons_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. RLS Helper Function (The Bridge)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT (auth.jwt() ->> 'sub');
$$ LANGUAGE sql STABLE;

-- 5. Update RLS Policies
-- We'll drop strict UUID policies and replace with generic Text policies using requesting_user_id()

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (requesting_user_id() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (requesting_user_id() = id);

-- DAILY RHEMA
DROP POLICY IF EXISTS "Users can view their own daily rhema" ON daily_rhema;
DROP POLICY IF EXISTS "Users can insert their own daily rhema" ON daily_rhema;

CREATE POLICY "Users can view their own daily rhema" ON daily_rhema FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Users can insert their own daily rhema" ON daily_rhema FOR INSERT WITH CHECK (requesting_user_id() = user_id);

-- SCRIPTURE / SERMONS (Update if they have user-scoped RLS)
-- (Assuming standard names for any other user-related tables)

COMMIT;
