-- Migration to add a function that allows bypassing auth for specific users
-- This function will check if a user exists in the manual_user_registry table
-- and verify their credentials without using the auth system

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.bypass_auth_for_user(
  p_email TEXT,
  p_password TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_password_hash TEXT;
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- Check if the user exists in manual_user_registry
  SELECT id, password_hash, full_name
  INTO v_user_record
  FROM public.manual_user_registry
  WHERE email = p_email;
  
  IF v_user_record IS NULL THEN
    -- User not found in manual registry
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found in manual registry',
      'user', NULL
    );
  END IF;
  
  -- Verify password (simple hash comparison for demonstration)
  -- In production, use a proper password hashing algorithm
  v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
  
  IF v_user_record.password_hash != v_password_hash THEN
    -- Password doesn't match
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid password',
      'user', NULL
    );
  END IF;
  
  -- Password matches, return user info
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Authentication successful',
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'email', p_email,
      'full_name', v_user_record.full_name
    )
  );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.bypass_auth_for_user(TEXT, TEXT) TO service_role;

-- Create a function to generate a session for a bypassed user
CREATE OR REPLACE FUNCTION public.generate_session_for_bypassed_user(
  p_user_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_session_id UUID := gen_random_uuid();
  v_expires_at TIMESTAMP WITH TIME ZONE := now() + interval '1 week';
  v_result jsonb;
BEGIN
  -- Check if the user exists in public.users
  SELECT id, email, full_name
  INTO v_user_record
  FROM public.users
  WHERE id = p_user_id;
  
  IF v_user_record IS NULL THEN
    -- User not found
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found in public.users',
      'session', NULL
    );
  END IF;
  
  -- Create a session record in a new table for bypassed sessions
  CREATE TABLE IF NOT EXISTS public.bypassed_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
  );
  
  -- Insert the session
  INSERT INTO public.bypassed_sessions (id, user_id, expires_at)
  VALUES (v_session_id, p_user_id, v_expires_at);
  
  -- Return session info
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Session generated successfully',
    'session', jsonb_build_object(
      'id', v_session_id,
      'user_id', p_user_id,
      'expires_at', v_expires_at
    ),
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'full_name', v_user_record.full_name
    )
  );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.generate_session_for_bypassed_user(UUID) TO service_role; 