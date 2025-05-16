-- Create dashboard_settings table (fixing the error in logs)
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'light',
  default_view TEXT DEFAULT 'monthly',
  widgets JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'quarterly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(budget_id, category_id)
);

-- Create budget_tracking table to track actual spending against budget
CREATE TABLE IF NOT EXISTS budget_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  month DATE NOT NULL, -- Store first day of month for easy querying
  planned_amount DECIMAL(12,2) NOT NULL,
  actual_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(budget_id, category_id, month)
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_dashboard_settings_modtime
BEFORE UPDATE ON dashboard_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_budgets_modtime
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_budget_categories_modtime
BEFORE UPDATE ON budget_categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_budget_tracking_modtime
BEFORE UPDATE ON budget_tracking
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable row level security
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_settings
CREATE POLICY "Users can view their own dashboard settings"
ON dashboard_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard settings"
ON dashboard_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard settings"
ON dashboard_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard settings"
ON dashboard_settings FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for budgets
CREATE POLICY "Users can view their own budgets"
ON budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
ON budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
ON budgets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
ON budgets FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for budget_categories
CREATE POLICY "Users can view their own budget categories"
ON budget_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own budget categories"
ON budget_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own budget categories"
ON budget_categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own budget categories"
ON budget_categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  )
);

-- Create policies for budget_tracking
CREATE POLICY "Users can view their own budget tracking"
ON budget_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_tracking.budget_id
    AND budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own budget tracking"
ON budget_tracking FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_tracking.budget_id
    AND budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own budget tracking"
ON budget_tracking FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_tracking.budget_id
    AND budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own budget tracking"
ON budget_tracking FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_tracking.budget_id
    AND budgets.user_id = auth.uid()
  )
);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_tracking;

-- Create function to automatically update budget tracking when transactions are added/updated
CREATE OR REPLACE FUNCTION update_budget_tracking_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  transaction_month DATE;
  category_id UUID;
  budget_records RECORD;
BEGIN
  -- Get the first day of the month for the transaction
  transaction_month := DATE_TRUNC('month', NEW.date)::DATE;
  category_id := NEW.category_id;
  
  -- Only proceed if we have a category
  IF category_id IS NOT NULL THEN
    -- Find all active budgets that include this category and month
    FOR budget_records IN 
      SELECT b.id AS budget_id
      FROM budgets b
      JOIN budget_categories bc ON b.id = bc.budget_id
      WHERE b.is_active = true
      AND bc.category_id = category_id
      AND transaction_month BETWEEN b.start_date AND b.end_date
    LOOP
      -- Update or insert budget tracking record
      INSERT INTO budget_tracking (
        budget_id, 
        category_id, 
        month, 
        planned_amount,
        actual_amount
      )
      SELECT 
        budget_records.budget_id,
        category_id,
        transaction_month,
        bc.amount,
        COALESCE(
          (SELECT SUM(t.amount) 
           FROM transactions t 
           WHERE t.category_id = category_id 
           AND DATE_TRUNC('month', t.date)::DATE = transaction_month),
          0
        )
      FROM budget_categories bc
      WHERE bc.budget_id = budget_records.budget_id
      AND bc.category_id = category_id
      ON CONFLICT (budget_id, category_id, month) 
      DO UPDATE SET
        actual_amount = COALESCE(
          (SELECT SUM(t.amount) 
           FROM transactions t 
           WHERE t.category_id = category_id 
           AND DATE_TRUNC('month', t.date)::DATE = transaction_month),
          0
        ),
        updated_at = NOW();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update budget tracking when transactions change
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_tracking_after_transaction_insert') THEN
        CREATE TRIGGER update_budget_tracking_after_transaction_insert
        AFTER INSERT ON transactions
        FOR EACH ROW
        WHEN (NEW.type = 'expense')
        EXECUTE FUNCTION update_budget_tracking_from_transaction();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_tracking_after_transaction_update') THEN
        CREATE TRIGGER update_budget_tracking_after_transaction_update
        AFTER UPDATE ON transactions
        FOR EACH ROW
        WHEN (OLD.type = 'expense' OR NEW.type = 'expense')
        EXECUTE FUNCTION update_budget_tracking_from_transaction();
    END IF;
END $$; 