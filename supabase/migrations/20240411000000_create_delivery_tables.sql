-- Create shipping zones table
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    countries TEXT[] NOT NULL,
    regions TEXT[],
    postal_codes TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery charge rates table
CREATE TABLE IF NOT EXISTS public.delivery_charge_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipping_zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_rate DECIMAL(12,2) NOT NULL DEFAULT 0,
    per_kg_rate DECIMAL(12,2) DEFAULT 0,
    min_weight DECIMAL(12,2) DEFAULT 0,
    max_weight DECIMAL(12,2),
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    max_order_amount DECIMAL(12,2),
    free_shipping_threshold DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed', 'cancelled')),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    shipping_address TEXT NOT NULL,
    weight DECIMAL(12,2),
    notes TEXT,
    tracking_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add delivery_charge_id to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS delivery_charge_id UUID REFERENCES delivery_charge_rates(id),
ADD COLUMN IF NOT EXISTS delivery_tracking_id UUID REFERENCES delivery_tracking(id),
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_charge_amount DECIMAL(12,2) DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shipping_zones_user_id ON shipping_zones(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_charge_rates_zone ON delivery_charge_rates(shipping_zone_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_invoice ON delivery_tracking(invoice_id);

-- Enable Row Level Security
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_charge_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own shipping zones"
    ON shipping_zones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipping zones"
    ON shipping_zones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipping zones"
    ON shipping_zones FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipping zones"
    ON shipping_zones FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own delivery charge rates"
    ON delivery_charge_rates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery charge rates"
    ON delivery_charge_rates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own delivery charge rates"
    ON delivery_charge_rates FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own delivery charge rates"
    ON delivery_charge_rates FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view delivery tracking for their invoices"
    ON delivery_tracking FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = delivery_tracking.invoice_id
        AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert delivery tracking for their invoices"
    ON delivery_tracking FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = delivery_tracking.invoice_id
        AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can update delivery tracking for their invoices"
    ON delivery_tracking FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = delivery_tracking.invoice_id
        AND invoices.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = delivery_tracking.invoice_id
        AND invoices.user_id = auth.uid()
    )); 