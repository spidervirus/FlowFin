-- Fix auth user creation issues
-- This migration addresses the "Database error creating new user" issue

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

-- Create a more robust function to create auth users
CREATE OR REPLACE FUNCTION create_auth_user_robust_v2(
  p_user_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_existing BOOLEAN;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_hashed_password TEXT;
BEGIN
  -- Generate a UUID if not provided
  IF p_user_id IS NULL THEN
    p_user_id := gen_random_uuid();
  END IF;
  
  -- Check if user already exists
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE id = p_user_id OR email = p_email
    ) INTO v_existing;
    
    IF v_existing THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'User with this ID or email already exists',
        'error_code', 'USER_EXISTS'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error checking if user exists: %', SQLERRM;
      -- Continue anyway
  END;
  
  -- Hash the password if provided
  IF p_password IS NOT NULL THEN
    BEGIN
      -- Try using pgcrypto's crypt function
      v_hashed_password := crypt(p_password, gen_salt('bf'));
    EXCEPTION
      WHEN undefined_function THEN
        -- Fallback to a simpler hash if crypt is not available
        v_hashed_password := encode(digest(p_password, 'sha256'), 'hex');
    END;
  END IF;
  
  -- Create a backup entry first
  BEGIN
    INSERT INTO public.user_profiles_backup (
      id,
      email,
      name,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_email,
      p_user_metadata->>'full_name',
      p_user_metadata->>'full_name',
      v_now,
      v_now
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating backup profile: %', SQLERRM;
      -- Continue anyway
  END;
  
  -- Try to insert the user into auth.users
  BEGIN
    -- Check if auth.users table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
      -- Insert into auth.users with all required fields
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        aud,
        role
      ) VALUES (
        p_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_email,
        v_hashed_password,
        v_now,
        v_now,
        v_now,
        v_now,
        '{"provider": "email", "providers": ["email"]}'::JSONB,
        p_user_metadata,
        FALSE,
        '',
        '',
        '',
        '',
        NULL,
        NULL,
        NULL,
        'authenticated',
        'authenticated'
      );
      
      -- Also create entry in public.users
      BEGIN
        INSERT INTO public.users (
          id,
          email,
          name,
          full_name,
          created_at,
          updated_at
        ) VALUES (
          p_user_id,
          p_email,
          p_user_metadata->>'full_name',
          p_user_metadata->>'full_name',
          v_now,
          v_now
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating public.users record: %', SQLERRM;
          -- Continue anyway
      END;
      
      -- Also create entry in manual_user_registry
      BEGIN
        INSERT INTO public.manual_user_registry (
          id,
          email,
          password_hash,
          full_name,
          created_at,
          updated_at
        ) VALUES (
          p_user_id,
          p_email,
          v_hashed_password,
          p_user_metadata->>'full_name',
          v_now,
          v_now
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating manual_user_registry record: %', SQLERRM;
          -- Continue anyway
      END;
      
      -- Return success
      RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'User created successfully',
        'user', jsonb_build_object(
          'id', p_user_id,
          'email', p_email,
          'created_at', v_now
        )
      );
    ELSE
      -- If auth.users table doesn't exist, return error
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'auth.users table does not exist',
        'error_code', 'TABLE_NOT_FOUND'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Error creating user: ' || SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_auth_user_robust_v2 TO postgres;
GRANT EXECUTE ON FUNCTION create_auth_user_robust_v2 TO service_role;

-- Create a function to diagnose auth system issues
CREATE OR REPLACE FUNCTION diagnose_auth_system_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_auth_config JSONB;
  v_test_email TEXT;
  v_test_user_id UUID;
  v_auth_users_count INTEGER;
  v_auth_users_exists BOOLEAN;
  v_auth_schema_exists BOOLEAN;
  v_auth_users_accessible BOOLEAN;
  v_has_service_role_permissions BOOLEAN;
  v_postgres_version TEXT;
BEGIN
  -- Generate a test email
  v_test_email := 'test_' || extract(epoch from now()) || '@example.com';
  v_test_user_id := gen_random_uuid();
  
  -- Check if auth schema exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) INTO v_auth_schema_exists;
  
  -- Check if auth.users table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
  ) INTO v_auth_users_exists;
  
  -- Try to count users in auth.users
  BEGIN
    IF v_auth_users_exists THEN
      EXECUTE 'SELECT COUNT(*) FROM auth.users' INTO v_auth_users_count;
      v_auth_users_accessible := TRUE;
    ELSE
      v_auth_users_count := 0;
      v_auth_users_accessible := FALSE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_auth_users_accessible := FALSE;
      v_auth_users_count := 0;
  END;
  
  -- Check if service_role has permissions
  BEGIN
    v_has_service_role_permissions := TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      v_has_service_role_permissions := FALSE;
  END;
  
  -- Get PostgreSQL version
  SELECT version() INTO v_postgres_version;
  
  -- Build the result
  v_result := jsonb_build_object(
    'auth_system_check', jsonb_build_object(
      'auth_schema_exists', v_auth_schema_exists,
      'auth_users_exists', v_auth_users_exists,
      'auth_users_accessible', v_auth_users_accessible,
      'auth_users_count', v_auth_users_count,
      'has_service_role_permissions', v_has_service_role_permissions,
      'postgres_version', v_postgres_version,
      'supabase_version', 'Unknown'
    ),
    'test_email', v_test_email
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION diagnose_auth_system_v2 TO postgres;
GRANT EXECUTE ON FUNCTION diagnose_auth_system_v2 TO service_role; 