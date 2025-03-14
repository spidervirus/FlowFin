-- Fix for the missing categories table
-- This script checks if the categories table exists and creates it if it doesn't

-- First, check if the categories table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
    ) THEN
        -- Create the categories table if it doesn't exist
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

        -- Create trigger for updated_at timestamp
        CREATE TRIGGER update_categories_modtime
        BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();

        -- Enable row level security
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

        -- Create policies for categories
        CREATE POLICY "Users can view their own categories"
        ON categories FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own categories"
        ON categories FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own categories"
        ON categories FOR UPDATE
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own categories"
        ON categories FOR DELETE
        USING (auth.uid() = user_id);

        RAISE NOTICE 'Categories table created successfully';
    ELSE
        RAISE NOTICE 'Categories table already exists';
    END IF;
END $$; 