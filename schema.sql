-- PROFILES TABLE
-- Links to auth.users and stores application-specific user data
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  tier text default 'GUEST' check (tier in ('GUEST', 'DISCIPLE', 'MINISTER')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRAYERS TABLE (For The Altar)
create table public.prayers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  category text, 
  is_answered boolean default false,
  prayed_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SERMONS TABLE (For The Studio)
create table public.sermons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  content_json jsonb, -- Stores the structured outline/notes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Security Policies (Row Level Security) could be added here
alter table public.profiles enable row level security;
alter table public.prayers enable row level security;
alter table public.sermons enable row level security;

-- Simple policies for dev (allow all authenticated users to do everything on their own data)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can crud own prayers" on prayers for all using (auth.uid() = user_id);
create policy "Users can crud own sermons" on sermons for all using (auth.uid() = user_id);
