-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT);

-- Drop existing tables
DROP TABLE IF EXISTS public.budget_tracking CASCADE;
DROP TABLE IF EXISTS public.budget_categories CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.recurring_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;

-- Configure auth schema
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Create auth functions
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '')::text;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.email() RETURNS text AS $$
  SELECT nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$ LANGUAGE sql STABLE;

-- Ensure the auth.users table exists and has the correct structure
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::text,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::text,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create auth indexes
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users (instance_id, email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (instance_id);

-- Create core tables first (no triggers or functions yet)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.chart_of_accounts (
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

CREATE TABLE public.company_settings (
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

CREATE TABLE public.categories (
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at
    BEFORE UPDATE ON public.chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user profile function
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT
) RETURNS void AS $$
BEGIN
    -- Insert into user_profiles table
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (user_id, user_email, user_full_name);

    -- Create default company settings
    INSERT INTO public.company_settings (
        user_id,
        company_name,
        default_currency,
        fiscal_year_start,
        tax_year_start
    )
    VALUES (
        user_id,
        'My Company',
        'USD',
        DATE_TRUNC('year', NOW()),
        DATE_TRUNC('year', NOW())
    );

    -- Create default categories
    INSERT INTO public.categories (user_id, name, type, color, is_default)
    VALUES
        (user_id, 'Salary', 'income', '#4CAF50', true),
        (user_id, 'Other Income', 'income', '#2196F3', true),
        (user_id, 'Food & Dining', 'expense', '#FF5722', true),
        (user_id, 'Transportation', 'expense', '#FFC107', true),
        (user_id, 'Housing', 'expense', '#9C27B0', true),
        (user_id, 'Utilities', 'expense', '#795548', true),
        (user_id, 'Healthcare', 'expense', '#F44336', true),
        (user_id, 'Entertainment', 'expense', '#3F51B5', true),
        (user_id, 'Shopping', 'expense', '#E91E63', true),
        (user_id, 'Other Expenses', 'expense', '#607D8B', true);

    -- Create default chart of accounts
    INSERT INTO public.chart_of_accounts (user_id, code, name, type, description, is_active)
    VALUES
        (user_id, '1000', 'Cash', 'asset', 'Cash on hand', true),
        (user_id, '2000', 'Accounts Payable', 'liability', 'Money owed to others', true),
        (user_id, '3000', 'Owner Equity', 'equity', 'Owner investment', true),
        (user_id, '4000', 'Revenue', 'revenue', 'Income from operations', true),
        (user_id, '5000', 'Expenses', 'expense', 'Operating expenses', true);

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
        -- Re-raise the exception
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the create_user_profile function
    PERFORM public.create_user_profile(
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the trigger
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view their own chart of accounts" ON public.chart_of_accounts;

-- Create RLS policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users can view their own company settings"
    ON public.company_settings
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own categories"
    ON public.categories
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own chart of accounts"
    ON public.chart_of_accounts
    FOR ALL
    USING (auth.uid() = user_id); 