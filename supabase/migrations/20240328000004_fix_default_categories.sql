-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.create_default_categories() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories_for_user() CASCADE;

-- Create function to handle default categories creation
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if categories table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
    ) THEN
        -- Insert default categories with proper schema reference
        INSERT INTO public.categories (
            user_id,
            name,
            type,
            color,
            is_default
        )
        VALUES
            -- Income categories
            (NEW.id, 'Salary', 'income', '#4CAF50', true),
            (NEW.id, 'Investments', 'income', '#2196F3', true),
            (NEW.id, 'Sales', 'income', '#9C27B0', true),
            (NEW.id, 'Other Income', 'income', '#607D8B', true),
            
            -- Expense categories
            (NEW.id, 'Housing', 'expense', '#F44336', true),
            (NEW.id, 'Transportation', 'expense', '#FF9800', true),
            (NEW.id, 'Food', 'expense', '#795548', true),
            (NEW.id, 'Utilities', 'expense', '#009688', true),
            (NEW.id, 'Insurance', 'expense', '#3F51B5', true),
            (NEW.id, 'Medical', 'expense', '#E91E63', true),
            (NEW.id, 'Entertainment', 'expense', '#673AB7', true),
            (NEW.id, 'Education', 'expense', '#00BCD4', true),
            (NEW.id, 'Office Supplies', 'expense', '#8BC34A', true),
            (NEW.id, 'Marketing', 'expense', '#FF5722', true),
            (NEW.id, 'Software', 'expense', '#03A9F4', true),
            (NEW.id, 'Other Expenses', 'expense', '#9E9E9E', true)
        ON CONFLICT (user_id, name, type) DO NOTHING;
    ELSE
        RAISE WARNING 'categories table does not exist yet';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in create_default_categories: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;

-- Create new trigger for default categories
CREATE TRIGGER on_auth_user_created_categories
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_categories();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_default_categories() TO postgres, service_role; 