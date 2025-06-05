-- Add missing columns to quotes table if they don't exist
DO $$ 
BEGIN
    -- Add discount_rate if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'discount_rate'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN discount_rate DECIMAL(5,2);
    END IF;

    -- Add discount_amount if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN discount_amount DECIMAL(12,2);
    END IF;

    -- Add tax_rate if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'tax_rate'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN tax_rate DECIMAL(5,2);
    END IF;

    -- Add tax_amount if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'tax_amount'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN tax_amount DECIMAL(12,2);
    END IF;

    -- Add terms if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'terms'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN terms TEXT;
    END IF;

    -- Add notes if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN notes TEXT;
    END IF;

    -- Add template_id if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN template_id UUID REFERENCES quote_templates(id) ON DELETE SET NULL;
    END IF;
END $$; 