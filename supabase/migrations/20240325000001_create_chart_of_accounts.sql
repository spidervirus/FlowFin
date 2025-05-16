-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash', 'other')),
  balance DECIMAL(19,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Update handle_new_user function to create default accounts
CREATE OR REPLACE FUNCTION public.handle_new_user(
  user_id uuid,
  user_email text,
  user_name text
) RETURNS void AS $$
DECLARE
  default_accounts TEXT[] := ARRAY['Checking Account', 'Savings Account', 'Credit Card'];
  default_types TEXT[] := ARRAY['checking', 'savings', 'credit'];
  i INTEGER;
BEGIN
  -- Insert into users table if the user doesn't exist
  INSERT INTO public.users (
    id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    user_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default accounts for the user
  FOR i IN 1..array_length(default_accounts, 1) LOOP
    INSERT INTO public.chart_of_accounts (
      user_id,
      name,
      type,
      balance,
      created_at,
      updated_at
    )
    VALUES (
      user_id,
      default_accounts[i],
      default_types[i],
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, name) DO NOTHING;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 