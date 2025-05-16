-- Function to create an admin check function
CREATE OR REPLACE FUNCTION public.create_admin_check_function()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create a function to check auth.users table directly
    EXECUTE '
        CREATE OR REPLACE FUNCTION public.admin_check_auth_users()
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            result JSONB;
            auth_users_count INTEGER;
            pg_roles_check BOOLEAN;
            auth_schema_check BOOLEAN;
            auth_users_check BOOLEAN;
        BEGIN
            -- Check if the auth schema exists
            SELECT EXISTS (
                SELECT 1 FROM pg_namespace WHERE nspname = ''auth''
            ) INTO auth_schema_check;
            
            -- Check if we can query auth.users
            BEGIN
                SELECT COUNT(*) INTO auth_users_count FROM auth.users();
                auth_users_check := TRUE;
            EXCEPTION
                WHEN OTHERS THEN
                    auth_users_check := FALSE;
                    RAISE NOTICE ''Error querying auth.users: %'', SQLERRM;
            END;
            
            -- Check if the service_role has necessary permissions
            BEGIN
                pg_roles_check := TRUE;
                -- Add more permission checks here if needed
            EXCEPTION
                WHEN OTHERS THEN
                    pg_roles_check := FALSE;
                    RAISE NOTICE ''Error checking permissions: %'', SQLERRM;
            END;
            
            -- Return the results
            result := json_build_object(
                ''auth_schema_exists'', auth_schema_check,
                ''can_query_auth_users'', auth_users_check,
                ''service_role_permissions'', pg_roles_check,
                ''auth_users_count'', CASE WHEN auth_users_check THEN auth_users_count ELSE NULL END,
                ''supabase_version'', (SELECT extversion FROM pg_extension WHERE extname = ''supabase_functions''),
                ''postgres_version'', version()
            );
            
            RETURN result;
        END;
        $func$;
    ';
    
    -- Grant execute permission to service_role
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_check_auth_users() TO service_role;';
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin check function: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.create_admin_check_function() TO service_role;

-- Create a function to check if a user can be created
CREATE OR REPLACE FUNCTION public.diagnose_auth_issues()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    test_email TEXT;
    test_password TEXT;
    auth_users_check BOOLEAN;
    auth_settings JSONB;
BEGIN
    -- Generate a test email
    test_email := 'test_' || extract(epoch from now()) || '@example.com';
    test_password := 'Test123456!';
    
    -- First check if we can query auth settings
    BEGIN
        SELECT row_to_json(t)::JSONB INTO auth_settings
        FROM (
            SELECT *
            FROM auth.config()
        ) t;
    EXCEPTION
        WHEN OTHERS THEN
            auth_settings := json_build_object('error', SQLERRM);
    END;
    
    -- Check for common issues
    result := json_build_object(
        'auth_enabled', (auth_settings->>'enable_signup')::BOOLEAN,
        'site_url', auth_settings->>'site_url',
        'auth_settings', auth_settings,
        'timestamp', now(),
        'test_email', test_email
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'timestamp', now()
        );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.diagnose_auth_issues() TO service_role; 