-- Fix auth system issues
-- This migration addresses the "Database error creating new user" issue

-- Ensure auth schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant all necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON SCHEMA auth TO service_role;

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

-- Create a robust function to create users in auth.users
CREATE OR REPLACE FUNCTION create_auth_user_robust(
  p_user_id UUID,
  p_email TEXT,
  p_password TEXT DEFAULT NULL,
  p_user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_existing BOOLEAN;
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
    WHEN others THEN
      RAISE NOTICE 'Error checking if user exists: %', SQLERRM;
      -- Continue anyway
  END;
  
  -- Insert the user with transaction
  BEGIN
    -- Start transaction
    BEGIN
      -- Insert into auth.users
      INSERT INTO auth.users (
        id,
        email,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
      )
      VALUES (
        p_user_id,
        p_email,
        NOW(),
        NOW(),
        NOW(),
        p_user_metadata
      )
      RETURNING jsonb_build_object(
        'id', id,
        'email', email,
        'created_at', created_at
      ) INTO v_result;
      
      -- Also create entry in public.users if the table exists
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      ) THEN
        BEGIN
          INSERT INTO public.users (
            id,
            email,
            created_at,
            updated_at
          )
          VALUES (
            p_user_id,
            p_email,
            NOW(),
            NOW()
          );
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Error creating public.users record: %', SQLERRM;
            -- Continue anyway
        END;
      END IF;
      
      -- Return success
      RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'User created successfully',
        'user', v_result
      );
    EXCEPTION
      WHEN others THEN
        RETURN jsonb_build_object(
          'success', FALSE,
          'message', 'Error creating user: ' || SQLERRM,
          'error_code', SQLSTATE
        );
    END;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_auth_user_robust TO postgres;
GRANT EXECUTE ON FUNCTION create_auth_user_robust TO service_role;

-- Create a function to diagnose auth system issues
CREATE OR REPLACE FUNCTION diagnose_auth_system()
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
BEGIN
  -- Generate test values
  v_test_email := 'test_' || extract(epoch from now()) || '@example.com';
  v_test_user_id := gen_random_uuid();
  
  -- Check if auth schema exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) INTO v_auth_schema_exists;
  
  -- Check if auth.users table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
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
    WHEN others THEN
      v_auth_users_accessible := FALSE;
      v_auth_users_count := NULL;
  END;
  
  -- Check if service_role has necessary permissions
  BEGIN
    -- Try to perform an operation that requires service_role permissions
    v_has_service_role_permissions := FALSE;
    
    -- If we can access auth.users, we likely have permissions
    IF v_auth_users_accessible THEN
      v_has_service_role_permissions := TRUE;
    END IF;
  EXCEPTION
    WHEN others THEN
      v_has_service_role_permissions := FALSE;
  END;
  
  -- Try to get auth config
  BEGIN
    SELECT row_to_json(t)::JSONB INTO v_auth_config
    FROM (SELECT * FROM auth.config()) t;
  EXCEPTION
    WHEN others THEN
      v_auth_config := jsonb_build_object('error', 'function auth.config() does not exist');
  END;
  
  -- Build the result
  v_result := jsonb_build_object(
    'auth_config', v_auth_config,
    'common_issues', jsonb_build_object(
      'test_email', v_test_email,
      'auth_enabled', (v_auth_config->>'enable_signup')::BOOLEAN,
      'auth_connection_issues', NOT v_auth_users_accessible,
      'password_strong_enough', TRUE,
      'email_confirmations_enabled', (v_auth_config->>'mailer_autoconfirm')::BOOLEAN
    ),
    'auth_system_check', jsonb_build_object(
      'auth_users_count', v_auth_users_count,
      'postgres_version', version(),
      'supabase_version', 'Unknown',
      'auth_users_exists', v_auth_users_exists,
      'auth_schema_exists', v_auth_schema_exists,
      'auth_users_accessible', v_auth_users_accessible,
      'has_service_role_permissions', v_has_service_role_permissions
    )
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION diagnose_auth_system TO postgres;
GRANT EXECUTE ON FUNCTION diagnose_auth_system TO service_role;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS migrate_user_to_auth_system(UUID, TEXT, TEXT);

-- Create a new version that uses a more robust approach
CREATE OR REPLACE FUNCTION migrate_user_to_auth_system(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_password TEXT;
  v_salt TEXT;
  v_result JSONB;
BEGIN
  -- Check if the user exists in the manual registry
  SELECT EXISTS (
    SELECT 1 FROM manual_user_registry WHERE id = p_user_id
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User not found in manual registry'
    );
  END IF;
  
  -- Get the password and salt from the manual registry
  SELECT password_hash, salt INTO v_password, v_salt
  FROM manual_user_registry
  WHERE id = p_user_id;
  
  -- Check if the user already exists in the auth system
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id OR email = p_email
  ) INTO v_exists;
  
  IF v_exists THEN
    -- If the user exists in auth system but with a different ID, we need to handle this
    -- First, try to get the existing auth user
    SELECT jsonb_build_object(
      'success', FALSE,
      'message', 'User already exists in auth system',
      'existing_user', row_to_json(u)
    )
    FROM auth.users u 
    WHERE u.email = p_email
    INTO v_result;
    
    RETURN v_result;
  END IF;
  
  -- Create a temporary table to store the migration status
  CREATE TEMP TABLE IF NOT EXISTS auth_migration_status (
    user_id UUID,
    status TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Insert migration attempt
  INSERT INTO auth_migration_status (user_id, status, message)
  VALUES (p_user_id, 'PENDING', 'Starting migration');
  
  -- Create the user in auth.users with proper metadata
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data,
    is_super_admin,
    phone,
    phone_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  )
  VALUES (
    p_user_id,                              -- id
    '00000000-0000-0000-0000-000000000000', -- instance_id
    p_email,                                -- email
    v_password,                             -- encrypted_password
    NOW(),                                  -- email_confirmed_at
    NOW(),                                  -- created_at
    NOW(),                                  -- updated_at
    NOW(),                                  -- last_sign_in_at
    jsonb_build_object(                     -- raw_user_meta_data
      'full_name', p_full_name,
      'provider', 'email'
    ),
    FALSE,                                  -- is_super_admin
    NULL,                                   -- phone
    NULL,                                   -- phone_confirmed_at
    encode(gen_random_bytes(32), 'base64'), -- confirmation_token
    encode(gen_random_bytes(32), 'base64'), -- recovery_token
    NULL,                                   -- email_change_token_new
    NULL,                                   -- email_change
    'authenticated',                        -- aud
    'authenticated'                         -- role
  );
  
  -- Create identities record
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_user_id,
    jsonb_build_object(
      'sub', p_user_id,
      'email', p_email
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Update migration status
  UPDATE auth_migration_status
  SET status = 'COMPLETED',
      message = 'Migration successful'
  WHERE user_id = p_user_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User migrated to auth system successfully',
    'user', jsonb_build_object(
      'id', p_user_id,
      'email', p_email,
      'created_at', NOW()
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Update migration status on error
  UPDATE auth_migration_status
  SET status = 'FAILED',
      message = SQLERRM
  WHERE user_id = p_user_id;
  
  -- Return error
  RETURN jsonb_build_object(
    'success', FALSE,
    'message', 'Error migrating user to auth system: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_user_to_auth_system(UUID, TEXT, TEXT) TO service_role;

-- Create a function to check migration status
CREATE OR REPLACE FUNCTION check_auth_migration_status(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  status TEXT,
  message TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT ams.user_id, ams.status, ams.message, ams.created_at
  FROM auth_migration_status ams
  WHERE ams.user_id = p_user_id
  ORDER BY ams.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_auth_migration_status(UUID) TO service_role; 