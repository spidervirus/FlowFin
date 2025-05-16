-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- Ensure clean state by dropping existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- 1. User Management Tables
--------------------------------------------------------------------------------

-- Core users table linked to auth.users
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company/Organization settings
DROP TABLE IF EXISTS public.company_settings CASCADE;
CREATE TABLE public.company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT,
    default_currency TEXT DEFAULT 'USD',
    fiscal_year_start DATE,
    tax_year_start DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Financial Core Tables
--------------------------------------------------------------------------------

-- Chart of Accounts
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
CREATE TABLE public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Categories for transactions
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Bank Accounts
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash', 'other')),
    balance DECIMAL(19,4) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    institution TEXT,
    account_number TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 3. Transactions & Budgeting Tables
--------------------------------------------------------------------------------

-- Transactions
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(19,4) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'reconciled')),
    reference_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Transactions
DROP TABLE IF EXISTS public.recurring_transactions CASCADE;
CREATE TABLE public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(19,4) NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    last_generated DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_period TEXT CHECK (recurrence_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Categories
DROP TABLE IF EXISTS public.budget_categories CASCADE;
CREATE TABLE public.budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id),
    amount DECIMAL(19,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(budget_id, category_id)
);

-- Budget Tracking
DROP TABLE IF EXISTS public.budget_tracking CASCADE;
CREATE TABLE public.budget_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id),
    month DATE NOT NULL,
    spent DECIMAL(19,4) NOT NULL DEFAULT 0,
    remaining DECIMAL(19,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(budget_id, category_id, month)
);

-- 4. Functions and Triggers
--------------------------------------------------------------------------------

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Create default company settings
    INSERT INTO public.company_settings (
        user_id,
        company_name,
        default_currency,
        fiscal_year_start,
        tax_year_start
    )
    VALUES (
        NEW.id,
        'My Company',
        'USD',
        DATE_TRUNC('year', NOW()),
        DATE_TRUNC('year', NOW())
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Create default categories
    INSERT INTO public.categories (user_id, name, type, is_default)
    VALUES
        (NEW.id, 'Salary', 'income', true),
        (NEW.id, 'Other Income', 'income', true),
        (NEW.id, 'Food & Dining', 'expense', true),
        (NEW.id, 'Transportation', 'expense', true),
        (NEW.id, 'Housing', 'expense', true),
        (NEW.id, 'Utilities', 'expense', true),
        (NEW.id, 'Healthcare', 'expense', true),
        (NEW.id, 'Entertainment', 'expense', true),
        (NEW.id, 'Shopping', 'expense', true),
        (NEW.id, 'Other Expenses', 'expense', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_updated_at ON %I;
             CREATE TRIGGER update_updated_at 
             BEFORE UPDATE ON %I 
             FOR EACH ROW 
             EXECUTE FUNCTION update_updated_at_column();',
            tbl, tbl
        );
    END LOOP;
END $$;

COMMIT; 