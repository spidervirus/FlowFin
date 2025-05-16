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