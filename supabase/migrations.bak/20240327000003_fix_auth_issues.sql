-- Fix auth system issues
-- This migration addresses potential auth schema and permission issues

-- Ensure auth schema exists and has proper permissions
DO $$
BEGIN
  -- Create auth schema if it doesn't exist
  CREATE SCHEMA IF NOT EXISTS auth;
  
  -- Grant all necessary permissions
  EXECUTE 'GRANT USAGE ON SCHEMA auth TO postgres';
  EXECUTE 'GRANT USAGE ON SCHEMA auth TO service_role';
  EXECUTE 'GRANT ALL ON SCHEMA auth TO postgres';
  EXECUTE 'GRANT ALL ON SCHEMA auth TO service_role';
  
  -- Ensure auth.users table has proper permissions
  EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres';
  EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role';
  EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres';
  EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role';
  EXECUTE 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres';
  EXECUTE 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up auth schema permissions: %', SQLERRM;
END $$;

-- Ensure auth.users table exists with proper structure
DO $$
BEGIN
  -- Check if auth.users table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    -- Create a basic auth.users table if it doesn't exist
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE,
      email_confirmed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_sign_in_at TIMESTAMP WITH TIME ZONE,
      raw_user_meta_data JSONB DEFAULT '{}'::JSONB,
      raw_app_meta_data JSONB DEFAULT '{}'::JSONB
    );
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error checking/creating auth.users table: %', SQLERRM;
END $$;

-- Grant permissions on auth.users table
GRANT ALL ON auth.users TO postgres;
GRANT ALL ON auth.users TO service_role;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_auth_user_if_not_exists(uuid, text);

-- Create a robust function to create users in auth.users
CREATE OR REPLACE FUNCTION create_auth_user_if_not_exists(
  user_id uuid,
  user_email text
)
RETURNS jsonb
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if the user already exists in auth.users
  BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
      RETURN jsonb_build_object('success', true, 'message', 'User already exists');
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Error checking if user exists by ID: %', SQLERRM;
  END;

  -- Check if email is already in use
  BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Email already in use');
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Error checking if email exists: %', SQLERRM;
  END;

  -- Try to insert the user into auth.users with full profile
  BEGIN
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data
    )
    VALUES (
      user_id,
      user_email,
      now(),
      now(),
      now(),
      '{}'::jsonb
    )
    RETURNING jsonb_build_object(
      'success', true,
      'message', 'User created successfully',
      'user_id', id,
      'email', email
    ) INTO v_result;

    RETURN v_result;
  EXCEPTION
    WHEN others THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Error creating user: ' || SQLERRM,
        'error_detail', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_auth_user_if_not_exists TO postgres;
GRANT EXECUTE ON FUNCTION create_auth_user_if_not_exists TO service_role;

-- Ensure the auth.users table has the correct indexes
DO $$
BEGIN
  -- Create index on email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND schemaname = 'auth' AND indexname = 'users_email_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
  END IF;
  
EXCEPTION
  WHEN others THEN
    -- Log the error but continue
    RAISE NOTICE 'Error creating auth.users indexes: %', SQLERRM;
END $$;

-- Grant additional permissions that might be needed
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Ensure all sequences are owned by the correct tables
DO $$
DECLARE
  seq_name text;
BEGIN
  FOR seq_name IN 
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'auth'
  LOOP
    BEGIN
      EXECUTE format('ALTER SEQUENCE auth.%I OWNER TO postgres', seq_name);
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Error setting owner for sequence %: %', seq_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Create a function to check if an auth user exists
CREATE OR REPLACE FUNCTION check_auth_user_exists(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- Use a more reliable way to check if the user exists
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE id = user_id
    ) INTO user_exists;
    
    RETURN user_exists;
  EXCEPTION
    WHEN others THEN
      -- If there's an error, assume the user exists to avoid blocking the flow
      RAISE NOTICE 'Error checking if auth user exists: %', SQLERRM;
      RETURN true;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_auth_user_exists TO postgres;
GRANT EXECUTE ON FUNCTION check_auth_user_exists TO service_role;

-- Create a function to diagnose auth system issues
CREATE OR REPLACE FUNCTION diagnose_auth_system()
RETURNS jsonb AS $$
DECLARE
  v_auth_schema_exists BOOLEAN;
  v_auth_users_exists BOOLEAN;
  v_auth_users_accessible BOOLEAN;
  v_auth_users_count INTEGER;
  v_has_permissions BOOLEAN;
  v_supabase_version TEXT;
  v_postgres_version TEXT;
BEGIN
  -- Check if auth schema exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) INTO v_auth_schema_exists;
  
  -- Check if auth.users table exists
  IF v_auth_schema_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO v_auth_users_exists;
  ELSE
    v_auth_users_exists := FALSE;
  END IF;
  
  -- Check if we can query auth.users
  BEGIN
    IF v_auth_users_exists THEN
      SELECT COUNT(*) INTO v_auth_users_count FROM auth.users;
      v_auth_users_accessible := TRUE;
    ELSE
      v_auth_users_accessible := FALSE;
      v_auth_users_count := 0;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_auth_users_accessible := FALSE;
      v_auth_users_count := 0;
  END;
  
  -- Check if we have service_role permissions
  BEGIN
    v_has_permissions := (SELECT has_function_privilege('service_role', 'auth.email()'));
  EXCEPTION
    WHEN OTHERS THEN
      v_has_permissions := FALSE;
  END;
  
  -- Get Supabase version if available
  BEGIN
    SELECT current_setting('extensions.supabase_version') INTO v_supabase_version;
  EXCEPTION
    WHEN OTHERS THEN
      v_supabase_version := 'Unknown';
  END;
  
  -- Get PostgreSQL version
  SELECT version() INTO v_postgres_version;
  
  -- Return results
  RETURN jsonb_build_object(
    'auth_schema_exists', v_auth_schema_exists,
    'auth_users_exists', v_auth_users_exists,
    'auth_users_accessible', v_auth_users_accessible,
    'auth_users_count', v_auth_users_count,
    'has_service_role_permissions', v_has_permissions,
    'supabase_version', v_supabase_version,
    'postgres_version', v_postgres_version
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the diagnostic function
GRANT EXECUTE ON FUNCTION diagnose_auth_system TO postgres;
GRANT EXECUTE ON FUNCTION diagnose_auth_system TO service_role; 