-- Create subscription_metrics view
CREATE OR REPLACE VIEW subscription_metrics AS
SELECT
  DATE_TRUNC('month', s.created_at) as month,
  COUNT(DISTINCT s.user_id) as total_subscribers,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.user_id END) as active_subscribers,
  COUNT(DISTINCT CASE WHEN s.status = 'canceled' THEN s.user_id END) as churned_subscribers,
  SUM(CASE 
    WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'PRO') THEN 25
    WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'ENTERPRISE') THEN 75
    ELSE 0
  END) as monthly_revenue
FROM subscriptions s
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY month DESC;

-- Create usage_metrics view
CREATE OR REPLACE VIEW usage_metrics AS
SELECT
  DATE_TRUNC('day', u.updated_at) as day,
  COUNT(DISTINCT u.user_id) as active_users,
  SUM(u.transactions_count) as total_transactions,
  SUM(u.receipts_count) as total_receipts,
  ROUND(AVG(u.transactions_count)::numeric, 2) as avg_transactions_per_user,
  ROUND(AVG(u.receipts_count)::numeric, 2) as avg_receipts_per_user
FROM usage_limits u
GROUP BY DATE_TRUNC('day', u.updated_at)
ORDER BY day DESC;

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  plan TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  transactions_remaining INTEGER,
  receipts_remaining INTEGER,
  next_reset_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'PRO') THEN 'PRO'
      WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'ENTERPRISE') THEN 'ENTERPRISE'
      ELSE 'FREE'
    END as plan,
    s.status,
    s.current_period_end,
    CASE 
      WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'PRO') THEN 
        GREATEST(0, 100 - COALESCE(ul.transactions_count, 0))
      WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'ENTERPRISE') THEN 
        -1 -- Unlimited
      ELSE
        GREATEST(0, 25 - COALESCE(ul.transactions_count, 0))
    END as transactions_remaining,
    CASE 
      WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'PRO') THEN 
        GREATEST(0, 50 - COALESCE(ul.receipts_count, 0))
      WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'ENTERPRISE') THEN 
        -1 -- Unlimited
      ELSE 0
    END as receipts_remaining,
    ul.reset_date as next_reset_date
  FROM subscriptions s
  LEFT JOIN usage_limits ul ON s.user_id = ul.user_id
  WHERE s.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get subscription analytics
CREATE OR REPLACE FUNCTION get_subscription_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  period TEXT,
  total_revenue NUMERIC,
  active_subscribers INTEGER,
  churn_rate NUMERIC,
  avg_revenue_per_user NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT
      DATE_TRUNC('month', s.created_at) as month,
      COUNT(DISTINCT s.user_id) as total_subs,
      COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.user_id END) as active_subs,
      COUNT(DISTINCT CASE WHEN s.status = 'canceled' THEN s.user_id END) as churned_subs,
      SUM(CASE 
        WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'PRO') THEN 25
        WHEN s.plan_id = (SELECT id FROM stripe_plans WHERE name = 'ENTERPRISE') THEN 75
        ELSE 0
      END) as revenue
    FROM subscriptions s
    WHERE s.created_at BETWEEN start_date AND end_date
    GROUP BY DATE_TRUNC('month', s.created_at)
  )
  SELECT
    TO_CHAR(month, 'Month YYYY') as period,
    revenue as total_revenue,
    active_subs as active_subscribers,
    ROUND((churned_subs::numeric / NULLIF(total_subs, 0) * 100)::numeric, 2) as churn_rate,
    ROUND((revenue::numeric / NULLIF(active_subs, 0))::numeric, 2) as avg_revenue_per_user
  FROM monthly_stats
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

-- Create rollback function
CREATE OR REPLACE FUNCTION rollback_subscription_analytics()
RETURNS void AS $$
BEGIN
  -- Drop views
  DROP VIEW IF EXISTS subscription_metrics;
  DROP VIEW IF EXISTS usage_metrics;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS get_user_subscription_status(UUID);
  DROP FUNCTION IF EXISTS get_subscription_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
END;
$$ LANGUAGE plpgsql; 