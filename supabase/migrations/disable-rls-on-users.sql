-- This script disables Row Level Security (RLS) on the users table
-- WARNING: This reduces security but can help resolve signup issues
-- Only use this if you understand the security implications

-- Disable RLS on the users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant all permissions on the users table to all roles
GRANT ALL ON public.users TO anon, authenticated, service_role;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users'; 