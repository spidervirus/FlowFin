-- Create the user_profiles_backup table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles_backup') THEN
        CREATE TABLE public.user_profiles_backup (
            id UUID PRIMARY KEY,
            email TEXT,
            name TEXT,
            full_name TEXT,
            token_identifier TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Add comment to the table
        COMMENT ON TABLE public.user_profiles_backup IS 'Backup table for user profiles when the main users table insertion fails';
    END IF;
END
$$;

-- Create index on email for faster lookups
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles_backup' 
        AND indexname = 'user_profiles_backup_email_idx'
    ) THEN
        CREATE INDEX user_profiles_backup_email_idx ON public.user_profiles_backup (email);
    END IF;
END
$$;

-- Grant permissions to authenticated and service_role
GRANT SELECT, INSERT, UPDATE ON public.user_profiles_backup TO authenticated;
GRANT ALL ON public.user_profiles_backup TO service_role;

-- Create or replace the function to insert a user profile with fallback to backup table
CREATE OR REPLACE FUNCTION public.insert_user_profile(
    p_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_full_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    retry_count INTEGER := 0;
    max_retries CONSTANT INTEGER := 5;
    retry_delay CONSTANT FLOAT := 0.5; -- seconds
    auth_user_exists BOOLEAN;
BEGIN
    -- First check if the auth user exists
    auth_user_exists := public.check_auth_user_exists(p_id);
    
    IF NOT auth_user_exists THEN
        RETURN json_build_object(
            'error', 'Auth user does not exist',
            'source', 'auth_check'
        );
    END IF;

    -- Check if user already exists in backup table
    SELECT json_build_object(
        'id', id,
        'email', email,
        'name', name,
        'full_name', full_name,
        'source', 'backup_existing'
    ) INTO result
    FROM public.user_profiles_backup
    WHERE id = p_id;
    
    -- If found in backup, update and return
    IF result IS NOT NULL THEN
        UPDATE public.user_profiles_backup
        SET 
            email = p_email,
            name = p_name,
            full_name = p_full_name,
            updated_at = now()
        WHERE id = p_id;
        
        RETURN result;
    END IF;

    -- Try to insert into the main users table with retries
    WHILE retry_count < max_retries LOOP
        BEGIN
            INSERT INTO public.users (id, email, name, full_name)
            VALUES (p_id, p_email, p_name, p_full_name)
            RETURNING json_build_object(
                'id', id,
                'email', email,
                'name', name,
                'full_name', full_name,
                'token_identifier', token_identifier,
                'source', 'main_table'
            ) INTO result;
            
            -- If successful, return the result
            RETURN result;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log the error
                RAISE NOTICE 'Error inserting into users table (attempt %): %', retry_count + 1, SQLERRM;
                
                -- Increment retry counter
                retry_count := retry_count + 1;
                
                -- If we haven't reached max retries, wait and try again
                IF retry_count < max_retries THEN
                    PERFORM pg_sleep(retry_delay);
                END IF;
        END;
    END LOOP;
    
    -- If we get here, all attempts to insert into the main table failed
    -- Try to insert into the backup table
    BEGIN
        INSERT INTO public.user_profiles_backup (id, email, name, full_name)
        VALUES (p_id, p_email, p_name, p_full_name)
        RETURNING json_build_object(
            'id', id,
            'email', email,
            'name', name,
            'full_name', full_name,
            'source', 'backup_new'
        ) INTO result;
        
        RETURN result;
    EXCEPTION
        WHEN unique_violation THEN
            -- If there's a unique violation, update the existing record
            UPDATE public.user_profiles_backup
            SET 
                email = p_email,
                name = p_name,
                full_name = p_full_name,
                updated_at = now()
            WHERE id = p_id
            RETURNING json_build_object(
                'id', id,
                'email', email,
                'name', name,
                'full_name', full_name,
                'source', 'backup_updated'
            ) INTO result;
            
            RETURN result;
        WHEN OTHERS THEN
            -- Log any other errors
            RAISE NOTICE 'Error inserting into backup table: %', SQLERRM;
            
            -- Return a failure result
            RETURN json_build_object(
                'error', SQLERRM,
                'source', 'failed'
            );
    END;
END;
$$;

-- Grant execute permission on the function to service_role
GRANT EXECUTE ON FUNCTION public.insert_user_profile(UUID, TEXT, TEXT, TEXT) TO service_role; 