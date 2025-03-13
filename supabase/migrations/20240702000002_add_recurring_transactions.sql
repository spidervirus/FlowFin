-- Add recurring transaction fields to transactions table
ALTER TABLE transactions
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
ADD COLUMN recurrence_start_date DATE,
ADD COLUMN recurrence_end_date DATE,
ADD COLUMN next_occurrence_date DATE,
ADD COLUMN parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Create index for faster queries on recurring transactions
CREATE INDEX idx_transactions_is_recurring ON transactions(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_transactions_next_occurrence ON transactions(next_occurrence_date) WHERE next_occurrence_date IS NOT NULL;

-- Update the Transaction type in the financial.ts file
COMMENT ON TABLE transactions IS 'Stores financial transactions with support for recurring transactions'; 