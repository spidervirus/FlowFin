-- Create function to automatically create a user record in public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    user_id,
    token_identifier,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.id,
    NEW.id,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create user record when a new user is created in auth.users
DROP TRIGGER IF EXISTS create_user_from_auth_user ON auth.users;
CREATE TRIGGER create_user_from_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 