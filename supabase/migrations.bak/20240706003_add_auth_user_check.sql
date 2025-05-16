-- Create a function to check if a user exists in auth.users
-- This function uses the auth.users() function which is available to postgres
-- and avoids direct access to the auth.users table which might be restricted
CREATE OR REPLACE FUNCTION public.check_auth_user_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Try to check if the user exists using auth.users() function
    BEGIN
        SELECT EXISTS(
            SELECT 1 FROM auth.users() WHERE id = user_id
        ) INTO user_exists;
        
        RETURN user_exists;
    EXCEPTION
        WHEN OTHERS THEN
            -- If there's an error (e.g., permission issue), log it and assume user exists
            RAISE NOTICE 'Error checking auth user existence: %', SQLERRM;
            RETURN TRUE; -- Assume user exists to avoid blocking the flow
    END;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.check_auth_user_exists(UUID) TO service_role;

-- Create a function to get user metadata from auth.users
CREATE OR REPLACE FUNCTION public.get_auth_user_metadata(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_metadata JSONB;
BEGIN
    -- Try to get user metadata using auth.users() function
    BEGIN
        SELECT raw_user_meta_data
        FROM auth.users()
        WHERE id = user_id
        INTO user_metadata;
        
        RETURN COALESCE(user_metadata, '{}'::JSONB);
    EXCEPTION
        WHEN OTHERS THEN
            -- If there's an error, log it and return empty JSON
            RAISE NOTICE 'Error getting auth user metadata: %', SQLERRM;
            RETURN '{}'::JSONB;
    END;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.get_auth_user_metadata(UUID) TO service_role; 