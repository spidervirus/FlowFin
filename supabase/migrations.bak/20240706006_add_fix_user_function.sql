-- Add a function to fix user issues
-- This migration adds a function to fix users that exist in the system but can't be accessed

-- Create a function to fix a user by email
CREATE OR REPLACE FUNCTION fix_user_by_email(
  p_email TEXT,
  p_password TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if the user exists in auth.users
  BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email
    LIMIT 1;
    
    v_exists := v_user_id IS NOT NULL;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Error checking if user exists in auth.users: %', SQLERRM;
      v_exists := FALSE;
  END;
  
  -- If the user doesn't exist in auth.users, check public.users
  IF NOT v_exists THEN
    BEGIN
      SELECT id INTO v_user_id
      FROM public.users
      WHERE email = p_email
      LIMIT 1;
      
      v_exists := v_user_id IS NOT NULL;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Error checking if user exists in public.users: %', SQLERRM;
        v_exists := FALSE;
    END;
  END IF;
  
  -- If the user doesn't exist in public.users, check user_profiles_backup
  IF NOT v_exists THEN
    BEGIN
      SELECT id INTO v_user_id
      FROM user_profiles_backup
      WHERE email = p_email
      LIMIT 1;
      
      v_exists := v_user_id IS NOT NULL;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Error checking if user exists in user_profiles_backup: %', SQLERRM;
        v_exists := FALSE;
    END;
  END IF;
  
  -- If the user doesn't exist anywhere, return an error
  IF NOT v_exists THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User not found in any table',
      'email', p_email
    );
  END IF;
  
  -- User exists, try to fix it
  BEGIN
    -- First, ensure the user exists in auth.users
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = v_user_id
    ) THEN
      -- Insert the user into auth.users
      INSERT INTO auth.users (
        id,
        email,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
      )
      VALUES (
        v_user_id,
        p_email,
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object('full_name', 'Fixed User')
      );
      
      RAISE NOTICE 'Inserted user into auth.users';
    END IF;
    
    -- Next, ensure the user exists in public.users
    IF NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = v_user_id
    ) THEN
      -- Insert the user into public.users
      INSERT INTO public.users (
        id,
        email,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        p_email,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Inserted user into public.users';
    END IF;
    
    -- If a password was provided, try to update it
    IF p_password IS NOT NULL THEN
      -- This is a simplified approach - in a real system, you'd need to hash the password
      -- and use the proper auth system APIs
      RAISE NOTICE 'Password provided, but password update not implemented in this function';
    END IF;
    
    -- Return success
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'User fixed successfully',
      'user_id', v_user_id,
      'email', p_email
    );
  EXCEPTION
    WHEN others THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Error fixing user: ' || SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fix_user_by_email TO postgres;
GRANT EXECUTE ON FUNCTION fix_user_by_email TO service_role; 