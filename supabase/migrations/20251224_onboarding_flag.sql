
alter table profiles 
add column if not exists has_completed_onboarding boolean default false;

-- Optional: Update existing users to true? 
-- The user requested "existing users with incomplete profiles might be forced".
-- So we leave defaults as false. But for dev convenience effectively, 
-- if they have 'full_name' set, maybe we consider them onboarded?
-- No, let's stick to the strict "No Escape" plan. Everyone calibrates.
