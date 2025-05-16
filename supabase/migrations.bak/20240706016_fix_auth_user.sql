-- Migration to fix the auth user directly in the database
-- This migration will:
-- 1. Check if the user exists in auth.users
-- 2. If not, create the user in auth.users with the same ID as in public.users
-- 3. Ensure the user has proper entries in auth.identities

-- Set variables
DO $$
DECLARE
    v_email TEXT := 'machalil4@gmail.com';
    v_user_id UUID := 'ffaf268b-b8cc-4c90-b48b-2e101aca4f66';
    v_hashed_password TEXT;
    v_user_exists BOOLEAN;
    v_identity_exists BOOLEAN;
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- Log the operation
    RAISE NOTICE 'Starting fix for user with email % and ID %', v_email, v_user_id;
    
    -- Check if user exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = v_user_id
    ) INTO v_user_exists;
    
    -- Check if user has an identity
    SELECT EXISTS (
        SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email'
    ) INTO v_identity_exists;
    
    -- Generate a hashed password (this is just a placeholder, will be updated later)
    v_hashed_password := '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM';
    
    -- If user doesn't exist in auth.users, create it
    IF NOT v_user_exists THEN
        RAISE NOTICE 'User does not exist in auth.users, creating...';
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            id, 
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            confirmation_sent_at,
            recovery_sent_at,
            email_change_sent_at,
            aud,
            role
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            v_email,
            v_hashed_password,
            v_now,
            v_now,
            v_now,
            v_now,
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Aman"}',
            FALSE,
            '',
            '',
            '',
            '',
            NULL,
            NULL,
            NULL,
            'authenticated',
            'authenticated'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'User created in auth.users';
    ELSE
        RAISE NOTICE 'User already exists in auth.users';
    END IF;
    
    -- If identity doesn't exist, create it
    IF NOT v_identity_exists THEN
        RAISE NOTICE 'Identity does not exist, creating...';
        
        -- Insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            jsonb_build_object('sub', v_user_id, 'email', v_email),
            'email',
            v_email,
            v_now,
            v_now,
            v_now
        )
        ON CONFLICT (provider, provider_id) DO NOTHING;
        
        RAISE NOTICE 'Identity created';
    ELSE
        RAISE NOTICE 'Identity already exists';
    END IF;
    
    -- Update the user's password to a known value that we can use to sign in
    -- Note: This is a placeholder. In a real scenario, you would use a proper password hashing function.
    -- For Supabase Auth, you might need to use their API to reset the password.
    
    RAISE NOTICE 'Fix completed for user %', v_email;
END $$; 