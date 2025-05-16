-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the manual_user_registry table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.manual_user_registry (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_manual_user_registry_email ON public.manual_user_registry (email);

-- Create the user_profiles_backup table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles_backup (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  full_name TEXT,
  token_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_backup_email ON public.user_profiles_backup (email);

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.manual_user_registry TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_profiles_backup TO service_role; 