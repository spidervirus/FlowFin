-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text, text) CASCADE;

-- Create auth helper functions
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  )::text
$$;

CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.email', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
  )::text
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _company_id uuid;
    _table_exists boolean;
BEGIN
    -- Check if required tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) INTO _table_exists;
    
    IF NOT _table_exists THEN
        RAISE WARNING 'Required tables do not exist yet, skipping profile creation';
        RETURN NEW;
    END IF;

    -- Start autonomous transaction for user_profiles
    BEGIN
        INSERT INTO public.user_profiles (id, email, full_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        -- Don't return here, try to create other resources
    END;

    -- Create company settings in separate transaction
    BEGIN
        -- Check if company_settings table exists
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'company_settings'
        ) INTO _table_exists;
        
        IF _table_exists THEN
            INSERT INTO public.company_settings (
                user_id,
                company_name,
                default_currency,
                fiscal_year_start,
                tax_year_start
            )
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
                'USD',
                DATE_TRUNC('year', NOW()),
                DATE_TRUNC('year', NOW())
            )
            RETURNING id INTO _company_id;
        ELSE
            RAISE WARNING 'company_settings table does not exist yet';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating company settings: %', SQLERRM;
        -- Continue execution
    END;

    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Create function for creating user profile via RPC
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    full_name TEXT
)
RETURNS public.user_profiles AS $$
DECLARE
    new_profile public.user_profiles;
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (user_id, user_email, full_name)
    RETURNING * INTO new_profile;

    RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 