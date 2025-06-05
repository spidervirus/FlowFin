-- Create quote_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- Enable Row Level Security
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quote items"
    ON public.quote_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own quote items"
    ON public.quote_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own quote items"
    ON public.quote_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own quote items"
    ON public.quote_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.uid()
        )
    );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_quote_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_quote_items_updated_at ON public.quote_items;
CREATE TRIGGER set_quote_items_updated_at
    BEFORE UPDATE ON public.quote_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_quote_items_updated_at();

-- Create function to update quote totals
CREATE OR REPLACE FUNCTION public.update_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
    quote_subtotal DECIMAL(12,2);
    quote_tax_amount DECIMAL(12,2);
    quote_discount_amount DECIMAL(12,2);
    quote_total DECIMAL(12,2);
BEGIN
    -- Calculate subtotal
    SELECT COALESCE(SUM(amount), 0)
    INTO quote_subtotal
    FROM public.quote_items
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    -- Get the quote record
    UPDATE public.quotes
    SET 
        subtotal = quote_subtotal,
        tax_amount = CASE 
            WHEN tax_rate IS NOT NULL 
            THEN ROUND((quote_subtotal * tax_rate / 100)::numeric, 2)
            ELSE NULL 
        END,
        discount_amount = CASE 
            WHEN discount_rate IS NOT NULL 
            THEN ROUND((quote_subtotal * discount_rate / 100)::numeric, 2)
            ELSE NULL 
        END,
        total = quote_subtotal + 
                COALESCE((quote_subtotal * COALESCE(tax_rate, 0) / 100), 0) -
                COALESCE((quote_subtotal * COALESCE(discount_rate, 0) / 100), 0)
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for quote totals updates
DROP TRIGGER IF EXISTS update_quote_totals_on_item_change ON public.quote_items;
CREATE TRIGGER update_quote_totals_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_quote_totals(); 