
-- Create enum for account types if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('expense', 'asset', 'liability', 'equity', 'revenue');
    END IF;
END$$;

-- Create chart_of_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type account_type NOT NULL,
    description TEXT,
    parent_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, code)
);

-- Add self-referential foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'chart_of_accounts_parent_id_fkey'
    ) THEN
        ALTER TABLE public.chart_of_accounts 
        ADD CONSTRAINT chart_of_accounts_parent_id_fkey 
        FOREIGN KEY (parent_id) 
        REFERENCES public.chart_of_accounts(id);
    END IF;
END$$;

-- Enable RLS if not already enabled
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can insert their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can update their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can delete their own chart of accounts" ON public.chart_of_accounts;

-- Create policies
CREATE POLICY "Users can view their own chart of accounts"
    ON public.chart_of_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chart of accounts"
    ON public.chart_of_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart of accounts"
    ON public.chart_of_accounts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart of accounts"
    ON public.chart_of_accounts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_user_id ON public.chart_of_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON public.chart_of_accounts(parent_id);
