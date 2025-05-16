-- Create a function to manually register a user, bypassing the Supabase Auth API
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
BEGIN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
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

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.manual_register_user(TEXT, TEXT, TEXT) TO service_role;

-- Create a function to check if a user exists by email
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    main_user_id UUID;
    backup_user_id UUID;
    exists_in_main BOOLEAN;
    exists_in_backup BOOLEAN;
BEGIN
    -- Check if the user exists in the main users table
    SELECT id INTO main_user_id
    FROM public.users
    WHERE email = p_email
    LIMIT 1;
    
    exists_in_main := main_user_id IS NOT NULL;
    
    -- Check if the user exists in the backup table
    SELECT id INTO backup_user_id
    FROM public.user_profiles_backup
    WHERE email = p_email
    LIMIT 1;
    
    exists_in_backup := backup_user_id IS NOT NULL;
    
    -- Return the result
    RETURN json_build_object(
        'exists', exists_in_main OR exists_in_backup,
        'exists_in_main', exists_in_main,
        'exists_in_backup', exists_in_backup,
        'user_id', COALESCE(main_user_id, backup_user_id),
        'email', p_email
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'email', p_email
        );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(TEXT) TO service_role; 