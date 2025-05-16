CREATE OR REPLACE FUNCTION public.handle_new_user(
  user_id uuid,
  user_email text,
  user_name text
) RETURNS void AS $$
BEGIN
  -- Insert into users table if the user doesn't exist
  INSERT INTO public.users (
    id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    user_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Additional setup can be added here (e.g., creating default settings)
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 