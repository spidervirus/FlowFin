const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndCreateCompanySettings() {
  try {
    console.log('Checking if company_settings table exists...');
    
    // Check if the table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'company_settings')
      .single();
    
    if (tableError && tableError.code !== 'PGRST116') {
      console.error('Error checking if table exists:', tableError);
      return;
    }
    
    if (!tableExists) {
      console.log('company_settings table does not exist. Creating it...');
      
      // Create the company_settings table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create company_settings table
          CREATE TABLE IF NOT EXISTS company_settings (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              company_name VARCHAR(255) NOT NULL,
              address TEXT,
              country VARCHAR(100) NOT NULL,
              default_currency VARCHAR(3) NOT NULL,
              fiscal_year_start VARCHAR(2) NOT NULL,
              industry VARCHAR(100),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id)
          );

          -- Create RLS policies
          ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own company settings"
              ON company_settings FOR SELECT
              USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own company settings"
              ON company_settings FOR INSERT
              WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own company settings"
              ON company_settings FOR UPDATE
              USING (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);

          -- Create function to update updated_at timestamp
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql';

          -- Create trigger to automatically update updated_at
          CREATE TRIGGER update_company_settings_updated_at
              BEFORE UPDATE ON company_settings
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
        `
      });
      
      if (createError) {
        console.error('Error creating company_settings table:', createError);
        return;
      }
      
      console.log('company_settings table created successfully!');
    } else {
      console.log('company_settings table already exists.');
    }
    
    // Check if the user_preferences table exists
    const { data: prefsExists, error: prefsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_preferences')
      .single();
    
    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error checking if user_preferences table exists:', prefsError);
      return;
    }
    
    if (!prefsExists) {
      console.log('user_preferences table does not exist. Creating it...');
      
      // Create the user_preferences table
      const { error: createPrefsError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create user_preferences table
          CREATE TABLE IF NOT EXISTS user_preferences (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              currency VARCHAR(3) NOT NULL DEFAULT 'USD',
              account_type VARCHAR(50) NOT NULL DEFAULT 'personal',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id)
          );

          -- Create RLS policies
          ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own preferences"
              ON user_preferences FOR SELECT
              USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own preferences"
              ON user_preferences FOR INSERT
              WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own preferences"
              ON user_preferences FOR UPDATE
              USING (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);

          -- Create trigger to automatically update updated_at
          CREATE TRIGGER update_user_preferences_updated_at
              BEFORE UPDATE ON user_preferences
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
        `
      });
      
      if (createPrefsError) {
        console.error('Error creating user_preferences table:', createPrefsError);
        return;
      }
      
      console.log('user_preferences table created successfully!');
    } else {
      console.log('user_preferences table already exists.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndCreateCompanySettings(); 