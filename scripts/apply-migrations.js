const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  try {
    console.log('Applying migrations...');
    
    // Read the company_settings migration file
    const companySettingsSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240313_create_company_settings.sql'),
      'utf8'
    );
    
    console.log('Migration file read successfully');
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', {
      sql: companySettingsSql
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try an alternative approach if the RPC method fails
      console.log('Trying alternative approach...');
      
      // Create a temporary table to check if we can execute SQL
      const { error: testError } = await supabase
        .from('_migration_test')
        .insert({ id: 1, name: 'test' });
      
      if (testError && testError.code === '42P01') {
        // Table doesn't exist, try to create it
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: 'CREATE TABLE IF NOT EXISTS _migration_test (id INT PRIMARY KEY, name TEXT);'
        });
        
        if (createError) {
          console.error('Error creating test table:', createError);
          console.log('You may need to run these migrations manually in the Supabase dashboard.');
        } else {
          console.log('Test table created successfully. You can now try running the migrations again.');
        }
      } else {
        console.error('Error testing database access:', testError);
      }
    } else {
      console.log('Migrations applied successfully!');
    }
  } catch (err) {
    console.error('Error applying migrations:', err);
  }
}

applyMigrations(); 