-- Function to verify a user's credentials in the manual registry
CREATE OR REPLACE FUNCTION public.verify_manual_user(
    p_email TEXT,
    p_password TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    is_valid BOOLEAN;
    result JSONB;
BEGIN
    -- Find the user in the manual registry
    SELECT * INTO user_record
    FROM public.manual_user_registry
    WHERE email = p_email;
    
    -- If user not found, return error
    IF user_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'User not found',
            'code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Verify the password using pgcrypto
    BEGIN
        -- Try to use pgcrypto's crypt function if available
        is_valid := user_record.password_hash = crypt(p_password, user_record.password_hash);
    EXCEPTION 
        WHEN undefined_function THEN
            -- Fallback to a simpler check if crypt is not available
            -- This is not secure and only for development/testing
            -- In production, always use proper password hashing
            is_valid := user_record.password_hash = p_password;
    END;
    
    -- If password is invalid, return error
    IF NOT is_valid THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Invalid credentials',
            'code', 'INVALID_CREDENTIALS'
        );
    END IF;
    
    -- Get user profile data
    SELECT 
        jsonb_build_object(
            'id', COALESCE(u.id, b.id),
            'email', COALESCE(u.email, b.email),
            'name', COALESCE(u.name, b.name),
            'full_name', COALESCE(u.full_name, b.full_name)
        ) INTO result
    FROM 
        public.manual_user_registry m
        LEFT JOIN public.users u ON m.id = u.id
        LEFT JOIN public.user_profiles_backup b ON m.id = b.id
    WHERE 
        m.id = user_record.id;
    
    -- Return success with user data
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'User verified successfully',
        'user', result,
        'user_id', user_record.id
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Error verifying user: ' || SQLERRM,
            'code', 'INTERNAL_ERROR'
        );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.verify_manual_user(TEXT, TEXT) TO service_role; 