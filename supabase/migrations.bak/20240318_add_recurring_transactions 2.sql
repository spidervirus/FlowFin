-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES public.categories(id),
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring transactions"
    ON public.recurring_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring transactions"
    ON public.recurring_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions"
    ON public.recurring_transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions"
    ON public.recurring_transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 