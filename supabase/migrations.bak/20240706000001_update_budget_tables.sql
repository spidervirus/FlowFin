-- Create budget_transactions table
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_budget_transactions_modtime
BEFORE UPDATE ON budget_transactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable row level security
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_transactions
CREATE POLICY "Users can view their own budget transactions"
ON budget_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget transactions"
ON budget_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget transactions"
ON budget_transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget transactions"
ON budget_transactions FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_category_id ON budget_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_date ON budget_transactions(date);

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE budget_transactions;

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
           FROM budget_transactions t 
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
           FROM budget_transactions t 
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
CREATE TRIGGER update_budget_tracking_after_transaction_insert
AFTER INSERT ON budget_transactions
FOR EACH ROW
EXECUTE FUNCTION update_budget_tracking_from_transaction();

CREATE TRIGGER update_budget_tracking_after_transaction_update
AFTER UPDATE ON budget_transactions
FOR EACH ROW
EXECUTE FUNCTION update_budget_tracking_from_transaction(); 