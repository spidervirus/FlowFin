// Script to fix the categories table issue
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables directly from .env.local file
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse the .env.local file
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.startsWith('#') || !line.trim()) return;
  
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    const value = valueParts.join('=').trim();
    envVars[key.trim()] = value;
  }
});

// Initialize Supabase client with service role key for admin access
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key available:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key. Make sure these are set in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function fixCategoriesTable() {
  console.log('Fixing categories table...');
  
  try {
    // Create the categories table directly using SQL
    const sql = `
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

            -- Create trigger for updated_at timestamp
            CREATE OR REPLACE FUNCTION update_modified_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

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
    `;
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('pgbouncer_exec', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternative approach
      console.log('Trying alternative approach with direct query...');
      
      // Check if categories table exists
      const { data, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'categories')
        .single();
      
      if (checkError) {
        console.error('Error checking if table exists:', checkError);
        console.log('Please go to the Supabase dashboard SQL editor and run the SQL manually.');
        return;
      }
      
      if (!data) {
        console.log('Categories table does not exist. Please create it manually through the Supabase dashboard SQL editor.');
      } else {
        console.log('Categories table already exists.');
      }
    } else {
      console.log('SQL executed successfully');
    }
    
    console.log('Categories table fix completed!');
  } catch (error) {
    console.error('Error fixing categories table:', error);
    console.log('Please go to the Supabase dashboard SQL editor and run the SQL from the migration file manually.');
  }
}

// Run the function
fixCategoriesTable(); 