-- Modify users table to make it easier to work with
ALTER TABLE public.users ALTER COLUMN token_identifier DROP NOT NULL;

-- Add a trigger to automatically generate a token_identifier if not provided
CREATE OR REPLACE FUNCTION generate_token_identifier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token_identifier IS NULL THEN
    NEW.token_identifier := 'user_' || NEW.id || '_' || extract(epoch from now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_token_identifier ON public.users;

-- Create trigger for both INSERT and UPDATE operations
CREATE TRIGGER set_token_identifier
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION generate_token_identifier();

-- Add a trigger to automatically set user_id if not provided
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_user_id ON public.users;

-- Create trigger for both INSERT and UPDATE operations
CREATE TRIGGER set_user_id
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- Update RLS policies to ensure service role can always access
DROP POLICY IF EXISTS "Enable insert for service role and matching user" ON public.users;
CREATE POLICY "Enable insert for service role and matching user"
ON public.users FOR INSERT
WITH CHECK (
  (auth.uid() = id) OR 
  (auth.jwt()->>'role' = 'service_role')
);

DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.users;
CREATE POLICY "Enable select for authenticated users"
ON public.users FOR SELECT
USING (
  (auth.uid() = id) OR 
  (auth.jwt()->>'role' = 'service_role')
);

DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
CREATE POLICY "Enable update for users based on id"
ON public.users FOR UPDATE
USING (
  (auth.uid() = id) OR 
  (auth.jwt()->>'role' = 'service_role')
);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Ensure auth schema permissions are correct
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON auth.users TO postgres;

-- DO NOT modify auth.users table directly as it causes permission errors
-- ALTER TABLE IF EXISTS auth.users DISABLE TRIGGER ALL;
-- ALTER TABLE IF EXISTS auth.users ENABLE TRIGGER ALL;

-- DO NOT modify constraints directly as it causes permission errors
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM pg_constraint 
--     WHERE conname = 'users_email_key' AND conrelid = 'auth.users'::regclass
--   ) THEN
--     ALTER TABLE auth.users DROP CONSTRAINT users_email_key;
--   END IF;
--   
--   ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email);
-- END $$; 