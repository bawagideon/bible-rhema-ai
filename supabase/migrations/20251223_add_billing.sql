-- Add billing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'SEEKER',
ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active', -- 'active', 'inactive', 'canceled'
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Secure function to update subscription (Service Role only)
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_user_id uuid,
  p_tier text,
  p_sub_id text,
  p_status text,
  p_period_end timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    tier = p_tier,
    paypal_subscription_id = p_sub_id,
    subscription_status = p_status,
    current_period_end = p_period_end
  WHERE id = p_user_id;
END;
$$;
