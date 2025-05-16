-- Create a function to migrate a user from the backup table to the main table
CREATE OR REPLACE FUNCTION public.migrate_user_from_backup(
    p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_user RECORD;
    result JSONB;
    retry_count INTEGER := 0;
    max_retries CONSTANT INTEGER := 5;
    retry_delay CONSTANT FLOAT := 0.5; -- seconds
BEGIN
    -- Check if the user exists in the backup table
    SELECT * INTO backup_user
    FROM public.user_profiles_backup
    WHERE id = p_user_id;
    
    IF backup_user IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found in backup table',
            'source', 'migrate_user'
        );
    END IF;
    
    -- Try to insert into the main users table with retries
    WHILE retry_count < max_retries LOOP
        BEGIN
            -- Check if the user already exists in the main table
            IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
                -- Update the existing user
                UPDATE public.users
                SET 
                    email = backup_user.email,
                    name = backup_user.name,
                    full_name = backup_user.full_name,
                    updated_at = now()
                WHERE id = p_user_id
                RETURNING json_build_object(
                    'success', true,
                    'message', 'User updated in main table',
                    'id', id,
                    'email', email,
                    'name', name,
                    'full_name', full_name,
                    'token_identifier', token_identifier,
                    'source', 'migrate_user_update'
                ) INTO result;
            ELSE
                -- Insert the user into the main table
                INSERT INTO public.users (id, email, name, full_name)
                VALUES (
                    backup_user.id, 
                    backup_user.email, 
                    backup_user.name, 
                    backup_user.full_name
                )
                RETURNING json_build_object(
                    'success', true,
                    'message', 'User migrated to main table',
                    'id', id,
                    'email', email,
                    'name', name,
                    'full_name', full_name,
                    'token_identifier', token_identifier,
                    'source', 'migrate_user_insert'
                ) INTO result;
            END IF;
            
            -- If successful, return the result
            RETURN result;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log the error
                RAISE NOTICE 'Error migrating user (attempt %): %', retry_count + 1, SQLERRM;
                
                -- Increment retry counter
                retry_count := retry_count + 1;
                
                -- If we haven't reached max retries, wait and try again
                IF retry_count < max_retries THEN
                    PERFORM pg_sleep(retry_delay);
                END IF;
        END;
    END LOOP;
    
    -- If we get here, all attempts failed
    RETURN json_build_object(
        'success', false,
        'message', 'Failed to migrate user after multiple attempts',
        'error', SQLERRM,
        'source', 'migrate_user_failed'
    );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.migrate_user_from_backup(UUID) TO service_role;

-- Create a function to migrate all users from the backup table to the main table
CREATE OR REPLACE FUNCTION public.migrate_all_users_from_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_user RECORD;
    success_count INTEGER := 0;
    failure_count INTEGER := 0;
    result JSONB;
    migration_result JSONB;
BEGIN
    -- Loop through all users in the backup table
    FOR backup_user IN 
        SELECT id FROM public.user_profiles_backup
    LOOP
        -- Try to migrate each user
        migration_result := public.migrate_user_from_backup(backup_user.id);
        
        -- Count successes and failures
        IF (migration_result->>'success')::BOOLEAN THEN
            success_count := success_count + 1;
        ELSE
            failure_count := failure_count + 1;
        END IF;
    END LOOP;
    
    -- Return the results
    RETURN json_build_object(
        'success', true,
        'message', 'Migration completed',
        'success_count', success_count,
        'failure_count', failure_count,
        'source', 'migrate_all_users'
    );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.migrate_all_users_from_backup() TO service_role; 