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