-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_contributions table to track individual contributions
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_financial_goals_modtime
BEFORE UPDATE ON financial_goals
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_goal_contributions_modtime
BEFORE UPDATE ON goal_contributions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable row level security
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_goals
CREATE POLICY "Users can view their own financial goals"
ON financial_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial goals"
ON financial_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial goals"
ON financial_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial goals"
ON financial_goals FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for goal_contributions
CREATE POLICY "Users can view their own goal contributions"
ON goal_contributions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM financial_goals
    WHERE financial_goals.id = goal_contributions.goal_id
    AND financial_goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own goal contributions"
ON goal_contributions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM financial_goals
    WHERE financial_goals.id = goal_contributions.goal_id
    AND financial_goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own goal contributions"
ON goal_contributions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM financial_goals
    WHERE financial_goals.id = goal_contributions.goal_id
    AND financial_goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own goal contributions"
ON goal_contributions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM financial_goals
    WHERE financial_goals.id = goal_contributions.goal_id
    AND financial_goals.user_id = auth.uid()
  )
);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE financial_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_contributions;

-- Create function to automatically update goal current_amount when contributions are added/updated/deleted
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
DECLARE
  goal_id UUID;
BEGIN
  -- Determine which goal to update
  IF TG_OP = 'DELETE' THEN
    goal_id := OLD.goal_id;
  ELSE
    goal_id := NEW.goal_id;
  END IF;
  
  -- Update the goal's current_amount
  UPDATE financial_goals
  SET 
    current_amount = COALESCE((
      SELECT SUM(amount) 
      FROM goal_contributions 
      WHERE goal_id = financial_goals.id
    ), 0),
    is_completed = CASE 
      WHEN COALESCE((
        SELECT SUM(amount) 
        FROM goal_contributions 
        WHERE goal_id = financial_goals.id
      ), 0) >= target_amount THEN true
      ELSE false
    END,
    updated_at = NOW()
  WHERE id = goal_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update goal current_amount when contributions change
CREATE TRIGGER update_goal_amount_after_contribution_insert
AFTER INSERT ON goal_contributions
FOR EACH ROW
EXECUTE FUNCTION update_goal_current_amount();

CREATE TRIGGER update_goal_amount_after_contribution_update
AFTER UPDATE ON goal_contributions
FOR EACH ROW
EXECUTE FUNCTION update_goal_current_amount();

CREATE TRIGGER update_goal_amount_after_contribution_delete
AFTER DELETE ON goal_contributions
FOR EACH ROW
EXECUTE FUNCTION update_goal_current_amount(); 