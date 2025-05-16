-- Add subscription-related fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Create materialized view for performance (internal use)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_subscription_details_mv AS
SELECT 
  u.id,
  u.email,
  COALESCE(s.plan_id, 'price_free') as plan_id,
  sp.name as plan_name,
  sp.price as plan_price,
  COALESCE(s.status, 'free') as subscription_status,
  s.current_period_end as subscription_end_date,
  s.cancel_at_period_end,
  ul.transactions_count,
  ul.receipts_count,
  CASE 
    WHEN sp.transaction_limit = -1 THEN NULL -- Unlimited
    ELSE GREATEST(0, sp.transaction_limit - COALESCE(ul.transactions_count, 0))
  END as transactions_remaining,
  CASE 
    WHEN sp.receipt_limit = -1 THEN NULL -- Unlimited
    ELSE GREATEST(0, sp.receipt_limit - COALESCE(ul.receipts_count, 0))
  END as receipts_remaining,
  ul.reset_date as next_reset_date
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN stripe_plans sp ON COALESCE(s.plan_id, 'price_free') = sp.id
LEFT JOIN usage_limits ul ON u.id = ul.user_id;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_mv_email ON user_subscription_details_mv(email);
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_mv_plan ON user_subscription_details_mv(plan_name);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_subscription_details()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_subscription_details_mv;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized view
DROP TRIGGER IF EXISTS refresh_user_subscription_details_trigger_users ON users;
CREATE TRIGGER refresh_user_subscription_details_trigger_users
  AFTER INSERT OR UPDATE OR DELETE
  ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_subscription_details();

DROP TRIGGER IF EXISTS refresh_user_subscription_details_trigger_subs ON subscriptions;
CREATE TRIGGER refresh_user_subscription_details_trigger_subs
  AFTER INSERT OR UPDATE OR DELETE
  ON subscriptions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_subscription_details();

DROP TRIGGER IF EXISTS refresh_user_subscription_details_trigger_usage ON usage_limits;
CREATE TRIGGER refresh_user_subscription_details_trigger_usage
  AFTER INSERT OR UPDATE OR DELETE
  ON usage_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_subscription_details();

-- Function to get user subscription details (replaces the view with RLS)
CREATE OR REPLACE FUNCTION get_user_subscription_details(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email TEXT,
  plan_id TEXT,
  plan_name TEXT,
  plan_price DECIMAL,
  subscription_status TEXT,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  transactions_count INTEGER,
  receipts_count INTEGER,
  transactions_remaining INTEGER,
  receipts_remaining INTEGER,
  next_reset_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user is requesting their own details or has service role
  IF user_uuid = auth.uid() OR auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN QUERY
    SELECT 
      mv.id,
      mv.email,
      mv.plan_id,
      mv.plan_name,
      mv.plan_price,
      mv.subscription_status,
      mv.subscription_end_date,
      mv.cancel_at_period_end,
      mv.transactions_count,
      mv.receipts_count,
      mv.transactions_remaining,
      mv.receipts_remaining,
      mv.next_reset_date
    FROM user_subscription_details_mv mv
    WHERE mv.id = user_uuid;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has access to a feature
CREATE OR REPLACE FUNCTION can_access_feature(
  user_uuid UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_name TEXT;
  v_subscription_status TEXT;
BEGIN
  -- Check if user is requesting their own details or has service role
  IF user_uuid = auth.uid() OR auth.jwt() ->> 'role' = 'service_role' THEN
    -- Get user's current plan and status
    SELECT plan_name, subscription_status
    INTO v_plan_name, v_subscription_status
    FROM user_subscription_details_mv
    WHERE id = user_uuid;

    -- Default to FREE plan if no subscription found
    IF v_plan_name IS NULL THEN
      v_plan_name := 'FREE';
      v_subscription_status := 'free';
    END IF;

    -- Check feature access based on plan
    RETURN CASE
      -- Basic features available to all plans
      WHEN feature_name IN ('basic_analytics', 'email_support') THEN true
      
      -- Features requiring active paid subscription
      WHEN feature_name IN ('advanced_analytics', 'priority_support', 'receipt_scanning') 
        AND v_plan_name IN ('PRO', 'ENTERPRISE') 
        AND v_subscription_status = 'active' THEN true
      
      -- Enterprise-only features
      WHEN feature_name IN ('custom_integrations', 'dedicated_support', 'unlimited_usage')
        AND v_plan_name = 'ENTERPRISE' 
        AND v_subscription_status = 'active' THEN true
      
      -- Default to false for any other feature
      ELSE false
    END;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user can perform an action based on their limits
CREATE OR REPLACE FUNCTION can_perform_action(
  user_uuid UUID,
  action_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Check if user is requesting their own details or has service role
  IF user_uuid = auth.uid() OR auth.jwt() ->> 'role' = 'service_role' THEN
    SELECT 
      CASE action_type
        WHEN 'create_transaction' THEN transactions_remaining
        WHEN 'scan_receipt' THEN receipts_remaining
        ELSE 0
      END
    INTO v_remaining
    FROM user_subscription_details_mv
    WHERE id = user_uuid;

    -- If remaining is NULL, it means unlimited
    -- If remaining > 0, user can perform the action
    RETURN v_remaining IS NULL OR v_remaining > 0;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rollback function
CREATE OR REPLACE FUNCTION rollback_user_subscriptions()
RETURNS void AS $$
BEGIN
  -- Drop triggers
  DROP TRIGGER IF EXISTS refresh_user_subscription_details_trigger_users ON users;
  DROP TRIGGER IF EXISTS refresh_user_subscription_details_trigger_subs ON subscriptions;
  DROP TRIGGER IF EXISTS refresh_user_subscription_details_trigger_usage ON usage_limits;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS refresh_user_subscription_details();
  DROP FUNCTION IF EXISTS can_access_feature(UUID, TEXT);
  DROP FUNCTION IF EXISTS can_perform_action(UUID, TEXT);
  DROP FUNCTION IF EXISTS get_user_subscription_details(UUID);
  
  -- Drop materialized view
  DROP MATERIALIZED VIEW IF EXISTS user_subscription_details_mv;
  
  -- Remove columns from users table
  ALTER TABLE users 
    DROP COLUMN IF EXISTS subscription_status,
    DROP COLUMN IF EXISTS subscription_updated_at,
    DROP COLUMN IF EXISTS trial_ends_at;
END;
$$ LANGUAGE plpgsql; 