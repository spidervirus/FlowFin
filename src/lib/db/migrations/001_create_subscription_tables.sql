-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stripe_plans table
CREATE TABLE IF NOT EXISTS stripe_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  transaction_limit INTEGER,
  receipt_limit INTEGER,
  description TEXT,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO stripe_plans (id, name, price, transaction_limit, receipt_limit, description, features) VALUES
('price_free', 'FREE', 0, 25, 0, 'Basic plan for personal use', 
  '{"features": ["25 transactions per month", "Basic analytics", "Email support"]}'),
('price_pro', 'PRO', 25, 100, 50, 'Professional plan for small businesses',
  '{"features": ["100 transactions per month", "50 receipts per month", "Advanced analytics", "Priority support"]}'),
('price_enterprise', 'ENTERPRISE', 75, -1, -1, 'Enterprise plan for large organizations',
  '{"features": ["Unlimited transactions", "Unlimited receipts", "Custom analytics", "24/7 Priority support", "Custom integrations"]}')
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  transaction_limit = EXCLUDED.transaction_limit,
  receipt_limit = EXCLUDED.receipt_limit,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transactions_count INTEGER DEFAULT 0,
  receipts_count INTEGER DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add stripe_customer_id to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON usage_limits;
CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to reset usage limits
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

-- Create trigger to reset usage limits when subscription is updated
DROP TRIGGER IF EXISTS reset_usage_limits_trigger ON subscriptions;
CREATE TRIGGER reset_usage_limits_trigger
  AFTER INSERT OR UPDATE OF current_period_end
  ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION reset_usage_limits();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Create RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for usage_limits
DROP POLICY IF EXISTS "Users can view their own usage limits" ON usage_limits;
CREATE POLICY "Users can view their own usage limits"
  ON usage_limits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all usage limits" ON usage_limits;
CREATE POLICY "Service role can manage all usage limits"
  ON usage_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create rollback function
CREATE OR REPLACE FUNCTION rollback_subscription_tables()
RETURNS void AS $$
BEGIN
  -- Drop triggers
  DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
  DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON usage_limits;
  DROP TRIGGER IF EXISTS reset_usage_limits_trigger ON subscriptions;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS update_updated_at_column();
  DROP FUNCTION IF EXISTS reset_usage_limits();
  
  -- Drop tables
  DROP TABLE IF EXISTS usage_limits;
  DROP TABLE IF EXISTS subscriptions;
  DROP TABLE IF EXISTS stripe_plans;
  
  -- Remove stripe_customer_id column
  ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
END;
$$ LANGUAGE plpgsql; 