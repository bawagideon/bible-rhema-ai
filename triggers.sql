-- FUNCTION: handle_new_user
-- This function is called by the trigger every time a new user is created in auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, tier)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'GUEST' -- Default tier
  );
  return new;
end;
$$;

-- TRIGGER: on_auth_user_created
-- Connects the function to the auth.users table
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- BACKFILL (Optional)
-- Run this if you have existing users who don't have profiles yet
-- insert into public.profiles (id, email, tier)
-- select id, email, 'GUEST'
-- from auth.users
-- where id not in (select id from public.profiles);
