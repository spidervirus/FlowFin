-- Function to reset usage limits
CREATE OR REPLACE FUNCTION reset_usage_limits()
RETURNS trigger AS $$
BEGIN
  -- Reset usage limits for the user
  INSERT INTO usage_limits (
    user_id,
    transactions_count,
    receipts_count,
    reset_date,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    0, -- Reset transactions count
    0, -- Reset receipts count
    NEW.current_period_end,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    transactions_count = 0,
    receipts_count = 0,
    reset_date = NEW.current_period_end,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS reset_usage_limits_trigger ON subscriptions;

-- Create trigger to reset usage limits when subscription is updated
CREATE TRIGGER reset_usage_limits_trigger
  AFTER INSERT OR UPDATE OF current_period_end
  ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION reset_usage_limits(); 