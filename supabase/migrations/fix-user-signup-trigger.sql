-- This script creates a trigger to automatically create a record in public.users
-- when a new user is created in auth.users

-- First, check if the function already exists and drop it if it does
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT;
  full_name_val TEXT;
  existing_user_count INTEGER;
BEGIN
  -- Check if a user with this ID already exists in public.users
  SELECT COUNT(*) INTO existing_user_count FROM public.users WHERE id = NEW.id;
  
  -- If user already exists, do nothing
  IF existing_user_count > 0 THEN
    RAISE NOTICE 'User with ID % already exists in public.users, skipping insertion', NEW.id;
    RETURN NEW;
  END IF;

  -- Extract name from metadata if available
  BEGIN
    name_val := NEW.raw_user_meta_data->>'full_name';
    full_name_val := NEW.raw_user_meta_data->>'full_name';
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error accessing metadata, use email as fallback
    name_val := NULL;
    full_name_val := NULL;
    RAISE NOTICE 'Error accessing user metadata: %', SQLERRM;
  END;
  
  -- If name is not available, use email as fallback
  IF name_val IS NULL OR name_val = '' THEN
    -- Extract username part from email (before @)
    name_val := split_part(NEW.email, '@', 1);
  END IF;
  
  IF full_name_val IS NULL OR full_name_val = '' THEN
    full_name_val := name_val;
  END IF;

  -- Insert a new record into public.users with error handling
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      full_name,
      user_id,
      token_identifier,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      name_val,
      full_name_val,
      NEW.id,
      NEW.id,
      COALESCE(NEW.created_at, NOW())
    )
    -- If there's a conflict, do nothing (this prevents errors if the user already exists)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Successfully created user profile for %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
-- First to the schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Then to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Specifically grant permissions on the users table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO postgres, anon, authenticated, service_role;

-- Grant permissions on the auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;

-- Ensure the function has proper permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Create the check_auth_email function if it doesn't exist
CREATE OR REPLACE FUNCTION public.check_auth_email(email_input TEXT)
RETURNS TABLE(id uuid, email text) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, email::text FROM auth.users WHERE email = email_input LIMIT 1;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_auth_email(text) TO postgres, anon, authenticated, service_role;

-- Verify the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'Trigger on_auth_user_created was not created successfully';
  END IF;
  
  -- Also verify the function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
  ) THEN
    RAISE EXCEPTION 'Function handle_new_user was not created successfully';
  END IF;
  
  -- And verify the check_auth_email function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'check_auth_email'
  ) THEN
    RAISE EXCEPTION 'Function check_auth_email was not created successfully';
  END IF;
END $$; 