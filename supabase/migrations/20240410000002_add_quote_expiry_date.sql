-- Add expiry_date column to quotes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE public.quotes 
        ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$; 