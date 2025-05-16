-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default company settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT,
    default_currency TEXT DEFAULT 'USD',
    fiscal_year_start DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Drop existing handle_new_user function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user(uuid, text, text);

-- Recreate handle_new_user function with company settings
CREATE OR REPLACE FUNCTION public.handle_new_user(
    user_id uuid,
    user_email text,
    user_name text
) RETURNS void AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (user_id, user_email, user_name, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Create default company settings
    INSERT INTO public.company_settings (
        user_id,
        company_name,
        default_currency,
        fiscal_year_start
    )
    VALUES (
        user_id,
        'My Company',
        'USD',
        DATE_TRUNC('year', NOW())
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
    SELECT public.handle_new_user(
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created(); 