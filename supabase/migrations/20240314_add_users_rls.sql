-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow insert during sign-up (when auth.uid() matches the id being inserted)
CREATE POLICY "Enable insert for service role and matching user"
ON public.users FOR INSERT
WITH CHECK (
  (auth.uid() = id) OR 
  (auth.jwt()->>'role' = 'service_role')
);

-- Allow users to read their own data
CREATE POLICY "Enable select for authenticated users"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Enable update for users based on id"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role; 