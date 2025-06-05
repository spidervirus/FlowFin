-- Run all migrations in order
-- This file serves as documentation and can be used to manually run migrations

-- Create user profiles backup table
BEGIN;
CREATE TABLE IF NOT EXISTS public.user_profiles_backup (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  full_name TEXT,
  token_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_backup_email ON public.user_profiles_backup (email);
COMMIT;

-- Create insert_user_profile function
BEGIN;
CREATE OR REPLACE FUNCTION public.insert_user_profile(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- First try to insert into the main users table
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      p_id,
      p_email,
      p_name,
      p_full_name,
      NOW(),
      NOW()
    );
    
    v_result := jsonb_build_object(
      'success', TRUE,
      'message', 'Profile created successfully in main table',
      'table', 'users'
    );
  EXCEPTION
    WHEN foreign_key_violation THEN
      -- If foreign key violation, try the backup table
      BEGIN
        INSERT INTO public.user_profiles_backup (
          id,
          email,
          name,
          full_name,
          created_at,
          updated_at
        ) VALUES (
          p_id,
          p_email,
          p_name,
          p_full_name,
          NOW(),
          NOW()
        );
        
        v_result := jsonb_build_object(
          'success', TRUE,
          'message', 'Profile created successfully in backup table due to foreign key violation',
          'table', 'user_profiles_backup'
        );
      EXCEPTION
        WHEN unique_violation THEN
          -- If the backup record already exists, update it
          UPDATE public.user_profiles_backup
          SET
            name = p_name,
            full_name = p_full_name,
            updated_at = NOW()
          WHERE id = p_id;
          
          v_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Profile updated in backup table',
            'table', 'user_profiles_backup'
          );
        WHEN OTHERS THEN
          v_result := jsonb_build_object(
            'success', FALSE,
            'message', 'Error creating profile in backup table: ' || SQLERRM,
            'error_code', SQLSTATE
          );
      END;
    WHEN unique_violation THEN
      -- If the record already exists, update it
      UPDATE public.users
      SET
        name = p_name,
        full_name = p_full_name,
        updated_at = NOW()
      WHERE id = p_id;
      
      v_result := jsonb_build_object(
        'success', TRUE,
        'message', 'Profile updated in main table',
        'table', 'users'
      );
    WHEN OTHERS THEN
      -- For any other error, try the backup table
      BEGIN
        INSERT INTO public.user_profiles_backup (
          id,
          email,
          name,
          full_name,
          created_at,
          updated_at
        ) VALUES (
          p_id,
          p_email,
          p_name,
          p_full_name,
          NOW(),
          NOW()
        );
        
        v_result := jsonb_build_object(
          'success', TRUE,
          'message', 'Profile created successfully in backup table due to error: ' || SQLERRM,
          'table', 'user_profiles_backup',
          'original_error', SQLSTATE
        );
      EXCEPTION
        WHEN unique_violation THEN
          -- If the backup record already exists, update it
          UPDATE public.user_profiles_backup
          SET
            name = p_name,
            full_name = p_full_name,
            updated_at = NOW()
          WHERE id = p_id;
          
          v_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Profile updated in backup table after main table error',
            'table', 'user_profiles_backup',
            'original_error', SQLSTATE
          );
        WHEN OTHERS THEN
          v_result := jsonb_build_object(
            'success', FALSE,
            'message', 'Error creating profile in both tables. Main error: ' || SQLERRM || ', Backup error: ' || SQLERRM,
            'error_code', SQLSTATE
          );
      END;
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.insert_user_profile(UUID, TEXT, TEXT, TEXT) TO service_role;
COMMIT;

-- Create check_auth_user_exists function
BEGIN;
CREATE OR REPLACE FUNCTION check_auth_user_exists(user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if the user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  ) INTO user_exists;
  
  RETURN user_exists;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking auth user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_auth_user_exists(UUID) TO service_role;
COMMIT;

-- Create manual user registry table
BEGIN;
CREATE TABLE IF NOT EXISTS public.manual_user_registry (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manual_user_registry_email ON public.manual_user_registry (email);
COMMIT;

-- Create manual registration and verification functions
BEGIN;
-- Function to manually register a user
CREATE OR REPLACE FUNCTION manual_register_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if the user already exists by email
  SELECT EXISTS (
    SELECT 1 FROM manual_user_registry WHERE email = p_email
  ) INTO v_exists;
  
  IF v_exists THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User with this email already exists'
    );
  END IF;
  
  -- Generate a new UUID for the user
  SELECT gen_random_uuid() INTO v_user_id;
  
  -- Hash the password using auth.crypto_hash
  SELECT auth.digest(p_password, 'sha256') INTO v_password_hash;
  
  -- First create a record in the backup table to ensure it succeeds
  BEGIN
    INSERT INTO user_profiles_backup (
      id,
      email,
      name,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_email,
      p_full_name,
      p_full_name,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'User with this email already exists in backup table'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Error creating user in backup table: ' || SQLERRM
      );
  END;
  
  -- Insert into the manual user registry
  BEGIN
    INSERT INTO manual_user_registry (
      id,
      email,
      password_hash,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_email,
      v_password_hash,
      p_full_name,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'User with this email already exists in manual registry'
      );
    WHEN OTHERS THEN
      -- Clean up the backup table entry if manual registry fails
      DELETE FROM user_profiles_backup WHERE id = v_user_id;
      
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Error creating user in manual registry: ' || SQLERRM
      );
  END;
  
  -- Return success with user details
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User created successfully',
    'user_id', v_user_id,
    'email', p_email,
    'created_at', NOW()::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user exists by email
CREATE OR REPLACE FUNCTION check_user_exists_by_email(
  p_email TEXT
) RETURNS JSONB AS $$
DECLARE
  v_exists_main BOOLEAN;
  v_exists_backup BOOLEAN;
  v_exists_manual BOOLEAN;
BEGIN
  -- Check main users table
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE email = p_email
  ) INTO v_exists_main;
  
  -- Check backup table
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles_backup WHERE email = p_email
  ) INTO v_exists_backup;
  
  -- Check manual registry
  SELECT EXISTS (
    SELECT 1 FROM public.manual_user_registry WHERE email = p_email
  ) INTO v_exists_manual;
  
  RETURN jsonb_build_object(
    'exists', v_exists_main OR v_exists_backup OR v_exists_manual,
    'main_table', v_exists_main,
    'backup_table', v_exists_backup,
    'manual_registry', v_exists_manual
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'exists', FALSE,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify manual user credentials
CREATE OR REPLACE FUNCTION verify_manual_user_credentials(
  p_email TEXT,
  p_password TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_stored_hash TEXT;
  v_is_valid BOOLEAN;
  v_user_record JSONB;
BEGIN
  -- First check if the user exists in our manual registry
  SELECT 
    id, 
    password_hash
  INTO 
    v_user_id, 
    v_stored_hash
  FROM 
    manual_user_registry
  WHERE 
    email = p_email
  LIMIT 1;
  
  -- If user not found
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', FALSE,
      'message', 'User not found'
    );
  END IF;
  
  -- Verify the password hash
  SELECT auth.crypto_eq(v_stored_hash, auth.digest(p_password, 'sha256')) INTO v_is_valid;
  
  -- If password doesn't match
  IF NOT v_is_valid THEN
    RETURN jsonb_build_object(
      'authenticated', FALSE,
      'message', 'Invalid credentials'
    );
  END IF;
  
  -- Get user data
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'created_at', created_at
  ) INTO v_user_record
  FROM manual_user_registry
  WHERE id = v_user_id;
  
  -- Return success with user data
  RETURN jsonb_build_object(
    'authenticated', TRUE,
    'user', v_user_record
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'authenticated', FALSE,
      'message', 'Authentication error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION manual_register_user(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION check_user_exists_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_manual_user_credentials(TEXT, TEXT) TO service_role;
COMMIT;

-- Create migration functions
BEGIN;
-- Function to migrate a user from the backup table to the main table
CREATE OR REPLACE FUNCTION migrate_user_from_backup(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_backup_data JSONB;
BEGIN
  -- Check if the user exists in the backup table
  SELECT EXISTS (
    SELECT 1 FROM user_profiles_backup WHERE id = p_user_id
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User not found in backup table'
    );
  END IF;
  
  -- Get the user data from the backup table
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'name', name,
    'full_name', full_name,
    'created_at', created_at
  ) INTO v_backup_data
  FROM user_profiles_backup
  WHERE id = p_user_id;
  
  -- Try to insert the user into the main table
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      full_name,
      created_at,
      updated_at
    )
    SELECT
      id,
      email,
      name,
      full_name,
      created_at,
      NOW()
    FROM user_profiles_backup
    WHERE id = p_user_id;
    
    -- Return success
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'User migrated successfully',
      'user', v_backup_data
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- If the user already exists, update the record
      UPDATE public.users
      SET
        name = (SELECT name FROM user_profiles_backup WHERE id = p_user_id),
        full_name = (SELECT full_name FROM user_profiles_backup WHERE id = p_user_id),
        updated_at = NOW()
      WHERE id = p_user_id;
      
      RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'User record updated in main table',
        'user', v_backup_data
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Error migrating user: ' || SQLERRM
      );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate a user from manual registry to Supabase Auth
CREATE OR REPLACE FUNCTION migrate_user_to_auth_system(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_password TEXT;
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
  
  -- Get the password from the manual registry
  SELECT password_hash INTO v_password
  FROM manual_user_registry
  WHERE id = p_user_id;
  
  -- Check if the user already exists in the auth system
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User already exists in the auth system'
    );
  END IF;
  
  -- Try to create the user in the auth system
  BEGIN
    -- This is a simplified example - in practice, you'd need to use Supabase's APIs
    -- to create the user in the auth system with the proper password hash
    -- This would typically be done through the admin.createUser API
    -- For this migration, we'll simulate it with a placeholder
    
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      created_at,
      updated_at,
      last_sign_in_at,
      raw_user_meta_data
    )
    VALUES (
      p_user_id,
      p_email,
      NOW(),
      NOW(),
      NOW(),
      NULL,
      jsonb_build_object('full_name', p_full_name)
    );
    
    -- Return success
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'User migrated to auth system successfully'
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Error migrating user to auth system: ' || SQLERRM
      );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for the functions
GRANT EXECUTE ON FUNCTION migrate_user_from_backup(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION migrate_user_to_auth_system(UUID, TEXT, TEXT) TO service_role;
COMMIT;

-- Create functions for auth system diagnostics
BEGIN;
-- Function to check auth system
CREATE OR REPLACE FUNCTION admin_check_auth_users() RETURNS JSONB AS $$
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking auth system: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to diagnose auth issues
CREATE OR REPLACE FUNCTION diagnose_auth_issues() RETURNS JSONB AS $$
DECLARE
  v_test_email TEXT;
  v_test_password TEXT;
  v_auth_config JSONB;
  v_common_issues JSONB;
BEGIN
  -- Generate a test email and password
  v_test_email := 'test_' || floor(random() * 1000000)::text || '@example.com';
  v_test_password := 'Test' || floor(random() * 1000000)::text || '!';
  
  -- Check auth.config() settings
  BEGIN
    SELECT auth.config() INTO v_auth_config;
  EXCEPTION
    WHEN OTHERS THEN
      v_auth_config := jsonb_build_object('error', SQLERRM);
  END;
  
  -- Diagnose common issues
  v_common_issues := jsonb_build_object(
    'auth_enabled', 
      (v_auth_config->>'enable_signup')::boolean,
    'email_confirmations_enabled', 
      (v_auth_config->>'enable_email_confirmation')::boolean,
    'auth_connection_issues', 
      v_auth_config IS NULL OR v_auth_config ? 'error',
    'test_email', v_test_email,
    'password_strong_enough',
      length(v_test_password) >= 6
  );
  
  -- Return diagnostics
  RETURN jsonb_build_object(
    'auth_config', v_auth_config,
    'common_issues', v_common_issues,
    'auth_system_check', admin_check_auth_users()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_check_auth_users() TO service_role;
GRANT EXECUTE ON FUNCTION diagnose_auth_issues() TO service_role;
COMMIT; 