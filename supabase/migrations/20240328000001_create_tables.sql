-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Wrap everything in a transaction
BEGIN;

-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS public.budget_tracking CASCADE;
DROP TABLE IF EXISTS public.budget_categories CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.recurring_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create tables in correct order with existence checks
DO $$
BEGIN
    -- Create user_profiles first
    CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create categories next
    CREATE TABLE IF NOT EXISTS public.categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        color TEXT,
        parent_id UUID REFERENCES public.categories(id),
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, name, type)
    );

    -- Create chart_of_accounts
    CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
        description TEXT,
        parent_id UUID REFERENCES public.chart_of_accounts(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, code)
    );

    -- Create company_settings
    CREATE TABLE IF NOT EXISTS public.company_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_name TEXT,
        default_currency TEXT DEFAULT 'USD',
        fiscal_year_start DATE,
        tax_year_start DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
    );
END $$;

-- Grant permissions
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;

GRANT ALL ON public.categories TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;

GRANT ALL ON public.chart_of_accounts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_of_accounts TO authenticated;

GRANT ALL ON public.company_settings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_user_id ON public.chart_of_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON public.chart_of_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON public.company_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own profiles" ON public.user_profiles 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = id);

CREATE POLICY "Users can manage their own categories" ON public.categories 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own chart of accounts" ON public.chart_of_accounts 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own company settings" ON public.company_settings 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT; 