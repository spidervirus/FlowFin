// Script to recreate the auth user with the same ID
const { createClient } = require('@supabase/supabase-js');
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

async function recreateAuthUser() {
  const email = 'machalil4@gmail.com';
  const password = 'Password123!';
  const userId = 'ffaf268b-b8cc-4c90-b48b-2e101aca4f66'; // From our inspection
  
  console.log('Recreating auth user with email:', email, 'and ID:', userId);
  
  try {
    // First, try to delete the user if it exists in auth but is corrupted
    console.log('\n1. Attempting to delete user if it exists in auth...');
    
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError.message);
        console.log('Continuing with recreation...');
      } else {
        console.log('User deleted successfully from auth system');
      }
    } catch (deleteErr) {
      console.error('Exception deleting user:', deleteErr);
      console.log('Continuing with recreation...');
    }
    
    // Now create the user with the specific ID
    console.log('\n2. Creating user with specific ID in auth system...');
    
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Aman' },
      id: userId
    });
    
    if (createError) {
      console.error('Error creating user with specific ID:', createError.message);
      
      // Try without specifying ID
      console.log('\n3. Trying to create user without specifying ID...');
      
      const { data: createDataNoId, error: createErrorNoId } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Aman' }
      });
      
      if (createErrorNoId) {
        console.error('Error creating user without ID:', createErrorNoId.message);
      } else {
        console.log('User created successfully without specific ID:', createDataNoId);
        
        // Now we need to update the public.users table to match the new ID
        console.log('\n4. Updating public.users table with new ID...');
        
        const newUserId = createDataNoId.user.id;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: newUserId, user_id: newUserId, token_identifier: newUserId })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating public.users:', updateError.message);
        } else {
          console.log('public.users table updated successfully');
          
          // Update user_profiles_backup table
          console.log('\n5. Updating user_profiles_backup table...');
          
          const { error: backupUpdateError } = await supabase
            .from('user_profiles_backup')
            .update({ id: newUserId, user_id: newUserId, token_identifier: newUserId })
            .eq('id', userId);
          
          if (backupUpdateError) {
            console.error('Error updating user_profiles_backup:', backupUpdateError.message);
          } else {
            console.log('user_profiles_backup table updated successfully');
          }
          
          // Update manual_user_registry table
          console.log('\n6. Updating manual_user_registry table...');
          
          const { error: manualUpdateError } = await supabase
            .from('manual_user_registry')
            .update({ id: newUserId })
            .eq('id', userId);
          
          if (manualUpdateError) {
            console.error('Error updating manual_user_registry:', manualUpdateError.message);
          } else {
            console.log('manual_user_registry table updated successfully');
          }
        }
      }
    } else {
      console.log('User created successfully with specific ID:', createData);
    }
    
    // Try to sign in with the user
    console.log('\n7. Attempting to sign in with the user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
    } else {
      console.log('Sign in successful:', {
        id: signInData.user.id,
        email: signInData.user.email,
        created_at: signInData.user.created_at
      });
    }
  } catch (error) {
    console.error('Exception during recreation:', error);
  }
}

// Run the function
recreateAuthUser()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });