-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash', 'other')),
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  institution TEXT,
  account_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(name, user_id, parent_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id UUID REFERENCES categories(id),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reconciled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create reconciliation table
CREATE TABLE IF NOT EXISTS reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  statement_balance DECIMAL(12,2) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create reconciliation_items table
CREATE TABLE IF NOT EXISTS reconciliation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_id UUID NOT NULL REFERENCES reconciliations(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reconciliation_id, transaction_id)
);

-- Create reports table to save report configurations
CREATE TABLE IF NOT EXISTS report_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income_statement', 'balance_sheet', 'cash_flow', 'custom')),
  filters JSONB,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_accounts_modtime
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_transactions_modtime
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reconciliations_modtime
BEFORE UPDATE ON reconciliations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reconciliation_items_modtime
BEFORE UPDATE ON reconciliation_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_report_configurations_modtime
BEFORE UPDATE ON report_configurations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert default categories
-- Create function to copy default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Income categories
  INSERT INTO categories (name, type, user_id, is_default) VALUES
  ('Salary', 'income', NEW.id, true),
  ('Freelance', 'income', NEW.id, true),
  ('Investments', 'income', NEW.id, true),
  ('Gifts', 'income', NEW.id, true),
  ('Other Income', 'income', NEW.id, true),
  
  -- Expense categories
  ('Housing', 'expense', NEW.id, true),
  ('Transportation', 'expense', NEW.id, true),
  ('Food', 'expense', NEW.id, true),
  ('Utilities', 'expense', NEW.id, true),
  ('Insurance', 'expense', NEW.id, true),
  ('Medical', 'expense', NEW.id, true),
  ('Entertainment', 'expense', NEW.id, true),
  ('Education', 'expense', NEW.id, true),
  ('Subscriptions', 'expense', NEW.id, true),
  ('Other Expenses', 'expense', NEW.id, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create default categories for new users
CREATE TRIGGER create_default_categories_for_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_default_categories_for_user();

-- Enable row level security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Accounts policies
CREATE POLICY "Users can view their own accounts"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
ON accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
ON accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
ON accounts FOR DELETE
USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- Reconciliations policies
CREATE POLICY "Users can view their own reconciliations"
ON reconciliations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reconciliations"
ON reconciliations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reconciliations"
ON reconciliations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reconciliations"
ON reconciliations FOR DELETE
USING (auth.uid() = user_id);

-- Reconciliation items policies
CREATE POLICY "Users can view their own reconciliation items"
ON reconciliation_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reconciliations
    WHERE reconciliations.id = reconciliation_items.reconciliation_id
    AND reconciliations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own reconciliation items"
ON reconciliation_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM reconciliations
    WHERE reconciliations.id = reconciliation_items.reconciliation_id
    AND reconciliations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own reconciliation items"
ON reconciliation_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM reconciliations
    WHERE reconciliations.id = reconciliation_items.reconciliation_id
    AND reconciliations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reconciliation items"
ON reconciliation_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM reconciliations
    WHERE reconciliations.id = reconciliation_items.reconciliation_id
    AND reconciliations.user_id = auth.uid()
  )
);

-- Report configurations policies
CREATE POLICY "Users can view their own report configurations"
ON report_configurations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report configurations"
ON report_configurations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report configurations"
ON report_configurations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report configurations"
ON report_configurations FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliations;
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliation_items;
ALTER PUBLICATION supabase_realtime ADD TABLE report_configurations;