-- Function to check if an email exists in auth.users
-- This is a helper function for the signup process

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS public.check_auth_email(text);

-- Create the function
CREATE OR REPLACE FUNCTION public.check_auth_email(email_input TEXT)
RETURNS TABLE(id uuid, email text) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, email::text FROM auth.users WHERE email = email_input LIMIT 1;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_auth_email(text) TO postgres, anon, authenticated, service_role;

-- Test the function
-- SELECT * FROM public.check_auth_email('test@example.com'); 