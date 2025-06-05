-- Create a simplified version of the insert_user_profile function
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

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.insert_user_profile(UUID, TEXT, TEXT, TEXT) TO service_role; 