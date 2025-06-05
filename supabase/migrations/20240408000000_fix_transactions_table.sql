-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;

-- Create bank_accounts table first
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

-- Add indexes for bank_accounts
CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS bank_accounts_type_idx ON public.bank_accounts(type);

-- Add trigger for updating updated_at on bank_accounts
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for bank_accounts
CREATE POLICY "Users can view their own accounts"
    ON public.bank_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON public.bank_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.bank_accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON public.bank_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Create transactions table
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

-- Add indexes for transactions
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);

-- Add trigger for updating updated_at on transactions
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for transactions
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id); 