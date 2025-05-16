-- Create receipt_items table
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_receipt_items_modtime
BEFORE UPDATE ON receipt_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable row level security
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Create policies for receipt_items
CREATE POLICY "Users can view their own receipt items"
ON receipt_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipt items"
ON receipt_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipt items"
ON receipt_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipt items"
ON receipt_items FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE receipt_items;

-- Add comment for documentation
COMMENT ON TABLE receipt_items IS 'Stores line items from receipts scanned by users'; 