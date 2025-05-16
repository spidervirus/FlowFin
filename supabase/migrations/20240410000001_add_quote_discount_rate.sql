 -- Add discount_rate column to quotes table if it doesn't exist
DO $$ 
BEGIN
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
END $$;

-- Update existing quotes to have a default discount_rate of 0
UPDATE public.quotes 
SET discount_rate = 0 
WHERE discount_rate IS NULL;