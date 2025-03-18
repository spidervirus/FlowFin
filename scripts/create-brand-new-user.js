// Script to create a completely new user with a different email
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

async function createBrandNewUser() {
  // Use a completely different email
  const newEmail = 'test_user_' + Date.now() + '@example.com';
  const password = 'Password123!';
  
  console.log('Creating brand new user with email:', newEmail);
  
  try {
    // Create a new user
    console.log('\n1. Creating new user...');
    
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: newEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Test User' }
    });
    
    if (createError) {
      console.error('Error creating new user:', createError.message);
      return;
    }
    
    console.log('New user created successfully:', {
      id: createData.user.id,
      email: createData.user.email
    });
    
    const newUserId = createData.user.id;
    
    // Try to sign in with the new user
    console.log('\n2. Attempting to sign in with the new user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: newEmail,
      password
    });
    
    if (signInError) {
      console.error('Error signing in with new user:', signInError.message);
    } else {
      console.log('Sign in successful with new user:', {
        id: signInData.user.id,
        email: signInData.user.email
      });
      
      // Check if the user was automatically added to public.users
      console.log('\n3. Checking if user was added to public.users...');
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', newUserId);
      
      if (userError) {
        console.error('Error checking public.users:', userError.message);
      } else if (userData && userData.length > 0) {
        console.log('User found in public.users:', userData[0]);
      } else {
        console.log('User not found in public.users, adding manually...');
        
        // Add the user to public.users
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: newUserId,
            email: newEmail,
            name: 'Test User',
            full_name: 'Test User',
            user_id: newUserId,
            token_identifier: newUserId
          });
        
        if (insertError) {
          console.error('Error adding user to public.users:', insertError.message);
        } else {
          console.log('User added to public.users successfully');
        }
      }
    }
    
    console.log('\n4. User creation summary:');
    console.log('Email:', newEmail);
    console.log('Password:', password);
    console.log('User ID:', newUserId);
    console.log('\nYou can now use this user for testing instead of the problematic one.');
  } catch (error) {
    console.error('Exception creating brand new user:', error);
  }
}

// Run the function
createBrandNewUser()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 