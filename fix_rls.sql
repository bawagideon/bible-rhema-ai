-- FIX RLS POLICY
-- The previous schema allowed SELECT and UPDATE, but forgot INSERT.
-- This prevents new users from effectively "existing" in the database.

-- 1. Allow users to insert their own profile
create policy "Users can insert own profile" 
on public.profiles 
for insert 
with check ( auth.uid() = id );

-- 2. Grant permissions to public (just in case)
grant all on public.profiles to postgres, anon, authenticated, service_role;
