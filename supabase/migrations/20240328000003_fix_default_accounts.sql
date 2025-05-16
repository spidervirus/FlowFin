-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_default_accounts() CASCADE;

-- Create function to handle default accounts creation
CREATE OR REPLACE FUNCTION public.create_default_accounts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if chart_of_accounts exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chart_of_accounts'
    ) THEN
        -- Insert default accounts with proper schema reference
        INSERT INTO public.chart_of_accounts (
            user_id,
            code,
            name,
            type,
            description,
            is_active
        )
        VALUES
            -- Assets
            (NEW.id, '1000', 'Cash', 'asset', 'Cash on hand and in bank accounts', true),
            (NEW.id, '1100', 'Accounts Receivable', 'asset', 'Money owed by customers', true),
            (NEW.id, '1200', 'Inventory', 'asset', 'Goods available for sale', true),
            
            -- Liabilities
            (NEW.id, '2000', 'Accounts Payable', 'liability', 'Money owed to suppliers', true),
            (NEW.id, '2100', 'Accrued Expenses', 'liability', 'Expenses incurred but not yet paid', true),
            
            -- Equity
            (NEW.id, '3000', 'Owner''s Equity', 'equity', 'Owner''s investment in the business', true),
            (NEW.id, '3100', 'Retained Earnings', 'equity', 'Accumulated profits or losses', true),
            
            -- Revenue
            (NEW.id, '4000', 'Sales Revenue', 'revenue', 'Income from sales', true),
            (NEW.id, '4100', 'Service Revenue', 'revenue', 'Income from services', true),
            
            -- Expenses
            (NEW.id, '5000', 'Cost of Goods Sold', 'expense', 'Direct cost of items sold', true),
            (NEW.id, '5100', 'Salaries Expense', 'expense', 'Employee salaries', true),
            (NEW.id, '5200', 'Rent Expense', 'expense', 'Office and facility rent', true),
            (NEW.id, '5300', 'Utilities Expense', 'expense', 'Electricity, water, etc.', true)
        ON CONFLICT (user_id, code) DO NOTHING;
    ELSE
        RAISE WARNING 'chart_of_accounts table does not exist yet';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in create_default_accounts: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_accounts ON auth.users;

-- Create new trigger for default accounts
CREATE TRIGGER on_auth_user_created_accounts
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_accounts();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_default_accounts() TO postgres, service_role; 