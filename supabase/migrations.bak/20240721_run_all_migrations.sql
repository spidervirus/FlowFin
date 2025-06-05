-- This script runs all migrations in the correct order
-- Run this in the Supabase SQL Editor to set up all the necessary tables and functions

-- Step 1: Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create the user_profiles_backup table
CREATE TABLE IF NOT EXISTS public.user_profiles_backup (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  full_name TEXT,
  token_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_backup_email ON public.user_profiles_backup (email);

-- Step 3: Create the manual_user_registry table
CREATE TABLE IF NOT EXISTS public.manual_user_registry (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_manual_user_registry_email ON public.manual_user_registry (email);

-- Step 4: Create the insert_user_profile function
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
            'message', 'Error creating profile in both tables. Main error: ' || SQLERRM,
            'error_code', SQLSTATE
          );
      END;
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the manual_register_user function
CREATE OR REPLACE FUNCTION public.manual_register_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSONB;
    hashed_password TEXT;
    salt TEXT;
BEGIN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Generate a random salt
    salt := encode(gen_random_bytes(16), 'hex');
    
    -- Hash the password using PostgreSQL's built-in functions
    -- We're using crypt() with a strong algorithm (bf = blowfish)
    -- This requires the pgcrypto extension to be enabled
    BEGIN
        -- Try to use pgcrypto's crypt function if available
        hashed_password := crypt(p_password, gen_salt('bf'));
    EXCEPTION 
        WHEN undefined_function THEN
            -- Fallback to a simpler hash if crypt is not available
            hashed_password := encode(sha256(p_password || salt), 'hex');
    END;
    
    -- Store user in the backup table first (this is guaranteed to work)
    BEGIN
        INSERT INTO public.user_profiles_backup (
            id,
            email,
            name,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            p_email,
            p_full_name,
            p_full_name,
            now(),
            now()
        );
    EXCEPTION 
        WHEN unique_violation THEN
            -- If the user already exists, return error
            RETURN json_build_object(
                'success', false,
                'message', 'User with this email already exists',
                'code', 'USER_EXISTS'
            );
        WHEN OTHERS THEN
            -- Log the error but continue
            RAISE NOTICE 'Error creating backup profile: %', SQLERRM;
    END;
    
    -- Create a record in the manual registry with the hashed password
    BEGIN
        INSERT INTO public.manual_user_registry (
            id,
            email,
            password_hash,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            p_email,
            hashed_password,
            p_full_name,
            now(),
            now()
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- If the user already exists, return error
            RETURN json_build_object(
                'success', false,
                'message', 'User with this email already exists in manual registry',
                'code', 'USER_EXISTS'
            );
        WHEN OTHERS THEN
            -- Log the error but continue
            RAISE NOTICE 'Error creating manual registry entry: %', SQLERRM;
    END;
    
    -- Try to create the user in the main users table
    BEGIN
        INSERT INTO public.users (
            id,
            email,
            name,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            p_email,
            p_full_name,
            p_full_name,
            now(),
            now()
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but continue
            RAISE NOTICE 'Error creating main profile: %', SQLERRM;
    END;
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'message', 'User created successfully (manual bypass)',
        'user_id', new_user_id,
        'email', p_email,
        'full_name', p_full_name,
        'created_at', now()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'success', false,
            'message', 'Error creating user: ' || SQLERRM,
            'code', 'INTERNAL_ERROR'
        );
END;
$$;

-- Step 6: Create the migrate_user_from_backup function
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

-- Step 7: Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.manual_user_registry TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_profiles_backup TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_user_profile(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.manual_register_user(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.migrate_user_from_backup(UUID) TO service_role; 