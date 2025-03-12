-- This SQL file was generated to create the necessary tables for the FlowFin application
-- Run this in the Supabase SQL Editor

-- Create financial tables
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
  updated_at TIMESTAMP WITH TIME ZONE,
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
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE,
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
  updated_at TIMESTAMP WITH TIME ZONE,
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
  updated_at TIMESTAMP WITH TIME ZONE,
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
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

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

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_address TEXT NOT NULL,
  notes TEXT,
  items JSONB NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable row level security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
ON invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON invoices FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- Insert sample data for the current user
INSERT INTO accounts (name, type, balance, currency, institution, account_number, is_active, user_id)
VALUES ('Checking Account', 'checking', 5000.00, 'USD', 'Demo Bank', 'XXXX1234', true, auth.uid());

-- Insert default categories for the current user
INSERT INTO categories (name, type, color, is_active, user_id)
VALUES 
  -- Income categories
  ('Salary', 'income', '#4CAF50', true, auth.uid()),
  ('Freelance', 'income', '#8BC34A', true, auth.uid()),
  ('Investments', 'income', '#CDDC39', true, auth.uid()),
  ('Gifts', 'income', '#FFEB3B', true, auth.uid()),
  ('Other Income', 'income', '#FFC107', true, auth.uid()),
  
  -- Expense categories
  ('Housing', 'expense', '#F44336', true, auth.uid()),
  ('Transportation', 'expense', '#E91E63', true, auth.uid()),
  ('Food', 'expense', '#9C27B0', true, auth.uid()),
  ('Utilities', 'expense', '#673AB7', true, auth.uid()),
  ('Insurance', 'expense', '#3F51B5', true, auth.uid()),
  ('Medical', 'expense', '#2196F3', true, auth.uid()),
  ('Entertainment', 'expense', '#03A9F4', true, auth.uid()),
  ('Education', 'expense', '#00BCD4', true, auth.uid()),
  ('Subscriptions', 'expense', '#009688', true, auth.uid()),
  ('Other Expenses', 'expense', '#FF5722', true, auth.uid());

-- Insert transactions for the current user
INSERT INTO transactions (date, description, amount, type, category_id, account_id, status, user_id)
VALUES 
  (CURRENT_DATE, 'Monthly Salary', 5000.00, 'income', 
   (SELECT id FROM categories WHERE name = 'Salary' AND user_id = auth.uid() LIMIT 1),
   (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
   'completed', auth.uid()),
  (CURRENT_DATE, 'Grocery Shopping', 150.00, 'expense', 
   (SELECT id FROM categories WHERE name = 'Food' AND user_id = auth.uid() LIMIT 1),
   (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
   'completed', auth.uid()),
  (CURRENT_DATE, 'Rent Payment', 1200.00, 'expense', 
   (SELECT id FROM categories WHERE name = 'Housing' AND user_id = auth.uid() LIMIT 1),
   (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
   'completed', auth.uid());

-- Insert invoice for the current user
INSERT INTO invoices (invoice_number, date, due_date, account_id, client_name, client_email, client_address, notes, items, total_amount, status, user_id)
VALUES (
  'INV-001',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
  'ACME Corporation',
  'billing@acme.com',
  '123 Main St, Anytown, USA',
  'Thank you for your business!',
  '[{"description":"Consulting Services","quantity":10,"rate":150,"amount":1500},{"description":"Software License","quantity":1,"rate":500,"amount":500}]',
  2000.00,
  'sent',
  auth.uid()
);
