-- Add subscription-related fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_period_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_end timestamp with time zone;

-- Create subscription_limits table to track usage
CREATE TABLE IF NOT EXISTS public.subscription_limits (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    transactions_count integer DEFAULT 0,
    receipts_count integer DEFAULT 0,
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to reset monthly limits
CREATE OR REPLACE FUNCTION reset_monthly_limits()
RETURNS void AS $$
BEGIN
    UPDATE public.subscription_limits
    SET 
        transactions_count = 0,
        receipts_count = 0,
        period_start = date_trunc('month', NOW()),
        period_end = date_trunc('month', NOW()) + interval '1 month',
        updated_at = NOW()
    WHERE period_end <= NOW();
END;
$$ LANGUAGE plpgsql; 