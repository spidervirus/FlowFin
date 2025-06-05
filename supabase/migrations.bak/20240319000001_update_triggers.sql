-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_modtime ON user_profiles;
DROP TRIGGER IF EXISTS update_organizations_modtime ON organizations;
DROP TRIGGER IF EXISTS update_roles_modtime ON roles;
DROP TRIGGER IF EXISTS update_accounts_modtime ON accounts;
DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
DROP TRIGGER IF EXISTS update_budget_tracking_after_transaction_insert ON transactions;
DROP TRIGGER IF EXISTS update_budget_tracking_after_transaction_update ON transactions;

-- Create updated_at triggers function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_user_profiles_modtime
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_organizations_modtime
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_roles_modtime
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_accounts_modtime
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_modtime
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create function for updating budget tracking
CREATE OR REPLACE FUNCTION update_budget_tracking_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  transaction_month DATE;
  category_id UUID;
  budget_records RECORD;
BEGIN
  transaction_month := DATE_TRUNC('month', NEW.date)::DATE;
  category_id := NEW.category_id;
  
  IF category_id IS NOT NULL THEN
    FOR budget_records IN 
      SELECT b.id AS budget_id
      FROM budgets b
      JOIN budget_categories bc ON b.id = bc.budget_id
      WHERE b.is_active = true
      AND bc.category_id = category_id
      AND transaction_month BETWEEN b.start_date AND b.end_date
    LOOP
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

-- Create triggers for budget tracking
CREATE TRIGGER update_budget_tracking_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
WHEN (NEW.type = 'expense')
EXECUTE FUNCTION update_budget_tracking_from_transaction();

CREATE TRIGGER update_budget_tracking_after_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.type = 'expense')
EXECUTE FUNCTION update_budget_tracking_from_transaction(); 