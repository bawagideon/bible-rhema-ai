-- Fix Daily Rhema Schema: Create the missing table

create table if not exists daily_rhema (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references profiles(id) on delete cascade,
    date date not null default current_date,
    content text not null,
    scripture_text text not null,
    scripture_ref text not null,
    prayer_focus text not null,
    created_at timestamptz default now(),
    constraint unique_user_date unique (user_id, date)
);

alter table daily_rhema enable row level security;

-- Policies (Safe to run multiple times, checks existence)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_rhema' AND policyname = 'Users can view their own daily rhema'
    ) THEN
        create policy "Users can view their own daily rhema"
            on daily_rhema for select
            using (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_rhema' AND policyname = 'Users can insert their own daily rhema'
    ) THEN
        create policy "Users can insert their own daily rhema"
            on daily_rhema for insert
            with check (auth.uid() = user_id);
    END IF;
END
$$;
