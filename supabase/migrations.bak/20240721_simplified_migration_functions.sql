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

-- Grant execute permissions for the functions
GRANT EXECUTE ON FUNCTION migrate_user_from_backup(UUID) TO service_role; 