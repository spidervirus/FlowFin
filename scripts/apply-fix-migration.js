// Script to apply the SQL migration to fix the auth user
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

async function applyFixMigration() {
  console.log('Applying migration to fix auth user...');
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240725_fix_auth_user.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL loaded');
    
    // Execute the SQL directly
    console.log('Executing SQL migration...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Error executing SQL via RPC:', error.message);
        
        // Try an alternative approach - create a temporary function
        console.log('Trying alternative approach...');
        
        // Create a temporary function to execute our SQL
        const createFuncSQL = `
          CREATE OR REPLACE FUNCTION public.temp_fix_auth_user()
          RETURNS void AS $$
          ${sql}
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        const { error: createFuncError } = await supabase.rpc('exec_sql', { sql: createFuncSQL });
        
        if (createFuncError) {
          console.error('Error creating temporary function:', createFuncError.message);
        } else {
          console.log('Temporary function created');
          
          // Execute the function
          const { error: execFuncError } = await supabase.rpc('temp_fix_auth_user');
          
          if (execFuncError) {
            console.error('Error executing temporary function:', execFuncError.message);
          } else {
            console.log('Temporary function executed successfully');
          }
          
          // Drop the temporary function
          const { error: dropFuncError } = await supabase.rpc('exec_sql', { 
            sql: 'DROP FUNCTION IF EXISTS public.temp_fix_auth_user()' 
          });
          
          if (dropFuncError) {
            console.error('Error dropping temporary function:', dropFuncError.message);
          } else {
            console.log('Temporary function dropped');
          }
        }
      } else {
        console.log('SQL migration executed successfully');
      }
    } catch (execError) {
      console.error('Exception executing SQL:', execError);
      
      // If exec_sql function doesn't exist, we need to create it first
      console.log('Creating exec_sql function...');
      
      const createExecSqlFunc = `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO postgres, service_role;
      `;
      
      // We can't use the function we're trying to create, so we need to use a direct query
      // This is tricky because we don't have direct SQL access through the JS client
      // Let's try to use the Supabase REST API directly
      
      console.log('Please run the following SQL in the Supabase SQL Editor:');
      console.log('---');
      console.log(createExecSqlFunc);
      console.log('---');
      console.log('Then run:');
      console.log('---');
      console.log(sql);
      console.log('---');
    }
    
    // After applying the migration, try to sign in with the user
    console.log('\nAttempting to sign in with the user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'machalil4@gmail.com',
      password: 'Password123!'
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
      
      // Try to reset the password using admin API
      console.log('\nAttempting to reset password...');
      
      const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
        'ffaf268b-b8cc-4c90-b48b-2e101aca4f66',
        { password: 'Password123!' }
      );
      
      if (resetError) {
        console.error('Error resetting password:', resetError.message);
      } else {
        console.log('Password reset successfully');
        
        // Try signing in again
        console.log('\nAttempting to sign in again after password reset...');
        
        const { data: signInAgainData, error: signInAgainError } = await supabase.auth.signInWithPassword({
          email: 'machalil4@gmail.com',
          password: 'Password123!'
        });
        
        if (signInAgainError) {
          console.error('Error signing in after password reset:', signInAgainError.message);
        } else {
          console.log('Sign in successful after password reset');
        }
      }
    } else {
      console.log('Sign in successful:', {
        id: signInData.user.id,
        email: signInData.user.email,
        created_at: signInData.user.created_at
      });
    }
  } catch (error) {
    console.error('Exception applying migration:', error);
  }
}

// Run the function
applyFixMigration()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 