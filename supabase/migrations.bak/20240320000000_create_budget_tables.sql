-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

DROP POLICY IF EXISTS "Users can view their own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert their own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can update their own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete their own budget categories" ON budget_categories;

DROP POLICY IF EXISTS "Users can view their own budget transactions" ON budget_transactions;
DROP POLICY IF EXISTS "Users can insert their own budget transactions" ON budget_transactions;
DROP POLICY IF EXISTS "Users can update their own budget transactions" ON budget_transactions;
DROP POLICY IF EXISTS "Users can delete their own budget transactions" ON budget_transactions;

-- Remove tables from realtime publication
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE budgets;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE budget_categories;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE budget_transactions;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
END $$;

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(budget_id, category_id)
);

-- Create budget_transactions table
CREATE TABLE IF NOT EXISTS budget_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_category_id ON budget_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_category_id ON budget_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_user_id ON budget_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_date ON budget_transactions(date);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own budgets"
    ON budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
    ON budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON budgets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON budgets FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own budget categories"
    ON budget_categories FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM budgets
        WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own budget categories"
    ON budget_categories FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM budgets
        WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own budget categories"
    ON budget_categories FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM budgets
        WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM budgets
        WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own budget categories"
    ON budget_categories FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM budgets
        WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own budget transactions"
    ON budget_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget transactions"
    ON budget_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget transactions"
    ON budget_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget transactions"
    ON budget_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON budget_categories;
DROP TRIGGER IF EXISTS update_budget_transactions_updated_at ON budget_transactions;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at
    BEFORE UPDATE ON budget_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_transactions_updated_at
    BEFORE UPDATE ON budget_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_transactions; 