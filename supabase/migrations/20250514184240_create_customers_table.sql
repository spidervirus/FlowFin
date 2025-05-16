-- supabase/migrations/20250514184240_create_customers_table.sql

BEGIN;

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT, -- Customer contact email, can be different from auth user's email
    phone TEXT,
    
    -- Billing Address
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    billing_city TEXT,
    billing_state_province TEXT,
    billing_postal_code TEXT,
    billing_country TEXT,

    -- Shipping Address
    shipping_address_line1 TEXT,
    shipping_address_line2 TEXT,
    shipping_city TEXT,
    shipping_state_province TEXT,
    shipping_postal_code TEXT,
    shipping_country TEXT,

    tax_id TEXT, -- e.g., VAT number, EIN
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_customer_name_for_user UNIQUE(user_id, name)
    -- Optional: Consider if email should be unique per user_id for customers
    -- CONSTRAINT unique_customer_email_for_user UNIQUE(user_id, email) 
);

-- 2. Add Indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email); -- If frequently searching/filtering by email
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name); -- If frequently searching/filtering by name

-- 3. Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
CREATE POLICY "Users can insert their own customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can update their own customers"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
CREATE POLICY "Users can delete their own customers"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Create Trigger for updated_at
-- Ensure the function exists (it should from previous migrations, but good practice)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT; 