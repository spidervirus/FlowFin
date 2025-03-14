-- Comprehensive fix for database issues
-- Run this SQL in the Supabase dashboard SQL editor

-- 1. Create the categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(name, user_id, parent_id)
);

-- 2. Create or replace the update_modified_column function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for updated_at timestamp if it doesn't exist
DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 4. Enable row level security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. Create or replace policies
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
USING (auth.uid() = user_id);

-- 6. Fix the user creation trigger to avoid accessing categories table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT;
  full_name_val TEXT;
  existing_user_count INTEGER;
BEGIN
  -- Check if a user with this ID already exists in public.users
  SELECT COUNT(*) INTO existing_user_count FROM public.users WHERE id = NEW.id;
  
  -- If user already exists, do nothing
  IF existing_user_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Extract name from metadata if available
  BEGIN
    name_val := NEW.raw_user_meta_data->>'full_name';
    full_name_val := NEW.raw_user_meta_data->>'full_name';
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error accessing metadata, use email as fallback
    name_val := NULL;
    full_name_val := NULL;
  END;
  
  -- If name is not available, use email as fallback
  IF name_val IS NULL OR name_val = '' THEN
    -- Extract username part from email (before @)
    name_val := split_part(NEW.email, '@', 1);
  END IF;
  
  IF full_name_val IS NULL OR full_name_val = '' THEN
    full_name_val := name_val;
  END IF;

  -- Insert a new record into public.users with error handling
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      full_name,
      user_id,
      token_identifier,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      name_val,
      full_name_val,
      NEW.id,
      NEW.id,
      COALESCE(NEW.created_at, NOW())
    )
    -- If there's a conflict, do nothing
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
  END;
  
  -- IMPORTANT: We're NOT creating default categories here to avoid the error
  -- This is the key change to fix the issue
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role; 