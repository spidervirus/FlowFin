-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chart of accounts"
    ON public.chart_of_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chart of accounts"
    ON public.chart_of_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart of accounts"
    ON public.chart_of_accounts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart of accounts"
    ON public.chart_of_accounts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_chart_of_accounts_user_id ON public.chart_of_accounts(user_id);