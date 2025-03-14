// Script to apply the user trigger migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying user trigger migration...');
  
  try {
    // Read the migration file
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240710000001_create_user_trigger.sql'),
      'utf8'
    );
    
    console.log('Migration file read successfully');
    
    // Execute the SQL directly using the REST API
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSql
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('User trigger migration applied successfully');
  } catch (err) {
    console.error('Error applying migration:', err);
  }
}

applyMigration(); 