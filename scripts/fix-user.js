// Script to fix a specific user
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

async function fixUser() {
  const email = 'machalil4@gmail.com';
  const password = 'Password123!';
  
  console.log('Fixing user with email:', email);
  
  try {
    // First, apply the migration to add the fix_user_by_email function
    console.log('Applying migration to add fix_user_by_email function...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240724_add_fix_user_function.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      // Try to execute the SQL directly
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSql });
      
      if (migrationError) {
        console.error('Error applying migration:', migrationError.message);
        console.log('Continuing anyway...');
      } else {
        console.log('Migration applied successfully');
      }
    } catch (migrationErr) {
      console.error('Exception applying migration:', migrationErr.message);
      console.log('Continuing anyway...');
    }
    
    // Now call the fix_user_by_email function
    console.log('Calling fix_user_by_email function...');
    
    try {
      const { data: fixData, error: fixError } = await supabase.rpc(
        'fix_user_by_email',
        {
          p_email: email,
          p_password: password
        }
      );
      
      if (fixError) {
        console.error('Error fixing user:', fixError.message);
      } else {
        console.log('User fixed successfully:', fixData);
        
        // Try to sign in with the fixed user
        console.log('Attempting to sign in with fixed user...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error('Error signing in with fixed user:', signInError.message);
          
          // Try to reset the password with admin API
          console.log('Attempting to reset password with admin API...');
          
          if (fixData && fixData.success && fixData.user_id) {
            const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
              fixData.user_id,
              { password }
            );
            
            if (resetError) {
              console.error('Error resetting password:', resetError.message);
            } else {
              console.log('Password reset successfully');
              
              // Try signing in again
              console.log('Attempting to sign in again after password reset...');
              
              const { data: signInAgainData, error: signInAgainError } = await supabase.auth.signInWithPassword({
                email,
                password
              });
              
              if (signInAgainError) {
                console.error('Error signing in after password reset:', signInAgainError.message);
              } else {
                console.log('Sign in successful after password reset');
              }
            }
          } else {
            console.error('Cannot reset password: missing user ID');
          }
        } else {
          console.log('Sign in successful');
        }
      }
    } catch (fixErr) {
      console.error('Exception fixing user:', fixErr.message);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
fixUser()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 