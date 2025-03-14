-- Fix for the missing categories table
-- Run this SQL in the Supabase dashboard SQL editor

-- Check if the categories table exists
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

        -- Create or replace the update_modified_column function if it doesn't exist
        -- This needs to be outside the DO block
        RAISE NOTICE 'Creating update_modified_column function';
    ELSE
        RAISE NOTICE 'Categories table already exists';
    END IF;
END $$;

-- Create the update_modified_column function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at timestamp (only if the categories table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_name = 'update_categories_modtime'
        AND event_object_table = 'categories'
    ) THEN
        CREATE TRIGGER update_categories_modtime
        BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
        
        RAISE NOTICE 'Created update_categories_modtime trigger';
    END IF;
END $$;

-- Enable row level security and create policies
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
    ) THEN
        -- Enable row level security
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

        -- Create policies for categories (only if they don't exist)
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'categories' 
            AND policyname = 'Users can view their own categories'
        ) THEN
            CREATE POLICY "Users can view their own categories"
            ON categories FOR SELECT
            USING (auth.uid() = user_id);
            
            RAISE NOTICE 'Created SELECT policy';
        END IF;

        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'categories' 
            AND policyname = 'Users can insert their own categories'
        ) THEN
            CREATE POLICY "Users can insert their own categories"
            ON categories FOR INSERT
            WITH CHECK (auth.uid() = user_id);
            
            RAISE NOTICE 'Created INSERT policy';
        END IF;

        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'categories' 
            AND policyname = 'Users can update their own categories'
        ) THEN
            CREATE POLICY "Users can update their own categories"
            ON categories FOR UPDATE
            USING (auth.uid() = user_id);
            
            RAISE NOTICE 'Created UPDATE policy';
        END IF;

        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'categories' 
            AND policyname = 'Users can delete their own categories'
        ) THEN
            CREATE POLICY "Users can delete their own categories"
            ON categories FOR DELETE
            USING (auth.uid() = user_id);
            
            RAISE NOTICE 'Created DELETE policy';
        END IF;
    END IF;
END $$;