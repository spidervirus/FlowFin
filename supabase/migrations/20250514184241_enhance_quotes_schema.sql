BEGIN;

-- Enhance quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, -- Link to customers
ADD COLUMN IF NOT EXISTS quote_number TEXT, -- User-friendly quote identifier
ADD COLUMN IF NOT EXISTS quote_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' NOT NULL; -- e.g., draft, sent, accepted, declined, invoiced

-- Add unique constraint for quote_number per user, if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_quote_number_per_user' AND conrelid = 'public.quotes'::regclass
    ) THEN
        ALTER TABLE public.quotes ADD CONSTRAINT unique_quote_number_per_user UNIQUE(user_id, quote_number);
    END IF;
END;
$$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_date ON public.quotes(quote_date);

-- Enhance quote_items table
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL; -- Link to predefined items

CREATE INDEX IF NOT EXISTS idx_quote_items_item_id ON public.quote_items(item_id);

-- Note: RLS policies for quotes and quote_items should already exist from their initial creation migrations.
-- If not, they would need to be added here.

-- It's assumed that updated_at triggers also exist. If not, add them:
-- CREATE TRIGGER set_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- CREATE TRIGGER set_quote_items_updated_at BEFORE UPDATE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT; 