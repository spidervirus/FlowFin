-- Fix issues with the users table
-- This migration addresses the foreign key constraint issues

-- First, let's create a function to ensure users exist in both tables
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting into public.users and the user doesn't exist in auth.users
  -- Try to create it in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
    BEGIN
      -- Try to insert the user into auth.users
      INSERT INTO auth.users (id, email, email_confirmed_at)
      VALUES (NEW.id, NEW.email, now());
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not insert into auth.users: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to ensure users exist in both tables
DROP TRIGGER IF EXISTS ensure_user_exists_trigger ON public.users;
CREATE TRIGGER ensure_user_exists_trigger
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_exists();

-- Create a more resilient version of the users table if needed
-- This is a backup approach if the foreign key constraint is causing issues
CREATE TABLE IF NOT EXISTS public.user_profiles_backup (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  full_name TEXT,
  image TEXT,
  avatar_url TEXT,
  user_id TEXT UNIQUE,
  token_identifier TEXT UNIQUE,
  subscription TEXT,
  credits TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create a function to sync users between tables
CREATE OR REPLACE FUNCTION sync_user_to_backup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the user in the backup table
  INSERT INTO public.user_profiles_backup (
    id, email, name, full_name, image, avatar_url, 
    user_id, token_identifier, subscription, credits, 
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, NEW.name, NEW.full_name, NEW.image, NEW.avatar_url,
    NEW.user_id, NEW.token_identifier, NEW.subscription, NEW.credits,
    NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    image = EXCLUDED.image,
    avatar_url = EXCLUDED.avatar_url,
    user_id = EXCLUDED.user_id,
    token_identifier = EXCLUDED.token_identifier,
    subscription = EXCLUDED.subscription,
    credits = EXCLUDED.credits,
    updated_at = EXCLUDED.updated_at;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to sync users between tables
DROP TRIGGER IF EXISTS sync_user_to_backup_trigger ON public.users;
CREATE TRIGGER sync_user_to_backup_trigger
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_to_backup();

-- Grant permissions on the backup table
GRANT ALL ON public.user_profiles_backup TO authenticated;
GRANT ALL ON public.user_profiles_backup TO service_role;

-- Create a function to insert a user profile with retry logic
CREATE OR REPLACE FUNCTION insert_user_profile(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  max_attempts INT := 5;
  current_attempt INT := 0;
  success BOOLEAN := FALSE;
BEGIN
  -- First check if the user already exists in the backup table
  -- If so, just return that data
  BEGIN
    SELECT to_jsonb(user_profiles_backup.*) INTO result
    FROM public.user_profiles_backup
    WHERE id = p_id;
    
    IF result IS NOT NULL THEN
      -- User already exists in backup table, just update and return
      UPDATE public.user_profiles_backup
      SET 
        email = p_email,
        name = p_name,
        full_name = p_full_name,
        updated_at = now()
      WHERE id = p_id;
      
      -- Add a note that we used the backup table
      result := result || jsonb_build_object('used_backup', TRUE, 'updated', TRUE);
      RETURN result;
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Error checking backup table: %', SQLERRM;
      -- Continue with the normal flow
  END;

  -- Try to insert into the main users table first
  WHILE current_attempt < max_attempts AND NOT success LOOP
    current_attempt := current_attempt + 1;
    
    BEGIN
      -- Try to insert into users table
      INSERT INTO public.users (id, email, name, full_name)
      VALUES (p_id, p_email, p_name, p_full_name)
      RETURNING to_jsonb(users.*) INTO result;
      
      success := TRUE;
    EXCEPTION
      WHEN others THEN
        -- If it fails, wait a bit and try again
        PERFORM pg_sleep(0.5);
        RAISE NOTICE 'Attempt % failed: %', current_attempt, SQLERRM;
    END;
  END LOOP;
  
  -- If all attempts failed, try the backup table
  IF NOT success THEN
    BEGIN
      -- Insert into backup table
      INSERT INTO public.user_profiles_backup (id, email, name, full_name)
      VALUES (p_id, p_email, p_name, p_full_name)
      RETURNING to_jsonb(user_profiles_backup.*) INTO result;
      
      -- Add a note that we used the backup table
      result := result || jsonb_build_object('used_backup', TRUE);
    EXCEPTION
      WHEN unique_violation THEN
        -- If the user already exists in the backup table, just update and return
        UPDATE public.user_profiles_backup
        SET 
          email = p_email,
          name = p_name,
          full_name = p_full_name,
          updated_at = now()
        WHERE id = p_id
        RETURNING to_jsonb(user_profiles_backup.*) INTO result;
        
        -- Add a note that we used the backup table
        result := result || jsonb_build_object('used_backup', TRUE, 'updated', TRUE);
      WHEN others THEN
        RAISE EXCEPTION 'Failed to insert user profile: %', SQLERRM;
    END;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION insert_user_profile TO service_role;

-- Create a function to create a user profile directly without the foreign key constraint
CREATE OR REPLACE FUNCTION create_user_profile_direct(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert directly into the backup table
  INSERT INTO public.user_profiles_backup (
    id, email, name, full_name
  ) VALUES (
    p_id, p_email, p_name, p_full_name
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    updated_at = now()
  RETURNING to_jsonb(user_profiles_backup.*) INTO result;
  
  -- Add a note that we used the backup table
  result := result || jsonb_build_object('used_backup', TRUE);
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile directly: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_user_profile_direct TO service_role; 