// Script to check user and sign in
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

async function checkUser() {
  const email = 'machalil4@gmail.com';
  const password = 'Password123!';
  
  console.log('Checking user with email:', email);
  
  try {
    // First, check if the user exists in the auth system
    console.log('Checking if user exists in auth system...');
    
    // Try to get user by email using a custom function
    try {
      const { data: userCheckData, error: userCheckError } = await supabase.rpc(
        'check_user_exists_by_email',
        { p_email: email }
      );
      
      if (userCheckError) {
        console.error('Error checking if user exists:', userCheckError.message);
      } else if (userCheckData && userCheckData.exists) {
        console.log('User exists according to check function:', userCheckData);
      } else {
        console.log('User does not exist according to check function');
      }
    } catch (checkError) {
      console.error('Function check_user_exists_by_email not available');
    }
    
    // Try to list all users to find the one we're looking for
    console.log('Listing all users...');
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError.message);
    } else {
      console.log(`Found ${allUsers.users.length} total users`);
      
      // Find our user
      const user = allUsers.users.find(u => u.email === email);
      
      if (user) {
        console.log('User found in list:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          confirmed_at: user.email_confirmed_at
        });
        
        // Try to sign in with the user
        console.log('Attempting to sign in with email:', email);
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error('Error signing in:', signInError.message);
          
          // Try to reset the user's password
          console.log('Attempting to reset password for user ID:', user.id);
          
          const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password }
          );
          
          if (resetError) {
            console.error('Error resetting password:', resetError.message);
          } else {
            console.log('Password reset successfully');
            
            // Try signing in again
            console.log('Attempting to sign in again after password reset');
            
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
          console.log('Sign in successful');
        }
      } else {
        console.log('User not found in the list of users');
        
        // Try to create a new user with admin API
        console.log('Attempting to create user with admin API...');
        
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: 'Test User' }
        });
        
        if (adminError) {
          console.error('Error creating user with admin API:', adminError.message);
          
          // Try with our robust function
          console.log('Attempting to create user with robust function...');
          
          const { data: robustData, error: robustError } = await supabase.rpc(
            'create_auth_user_robust',
            {
              p_user_id: null,
              p_email: email,
              p_password: password,
              p_user_metadata: { full_name: 'Test User' }
            }
          );
          
          if (robustError) {
            console.error('Error creating user with robust function:', robustError.message);
            
            // If the error is that the user already exists, try to find it again
            if (robustError.message.includes('already exists') || 
                (robustData && !robustData.success && robustData.error_code === 'USER_EXISTS')) {
              console.log('User already exists, trying to find it again...');
              
              // Try to get user by email from public.users table
              const { data: publicUsers, error: publicError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();
              
              if (publicError) {
                console.error('Error checking public.users:', publicError.message);
              } else if (publicUsers) {
                console.log('User found in public.users:', publicUsers);
                
                // Try to reset password with a direct SQL function
                console.log('Attempting to reset password with direct function...');
                
                try {
                  const { data: resetData, error: resetError } = await supabase.rpc(
                    'reset_user_password',
                    {
                      p_email: email,
                      p_password: password
                    }
                  );
                  
                  if (resetError) {
                    console.error('Error resetting password with function:', resetError.message);
                  } else if (resetData) {
                    console.log('Password reset with function:', resetData);
                    
                    // Try signing in
                    console.log('Attempting to sign in after password reset');
                    
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                      email,
                      password
                    });
                    
                    if (signInError) {
                      console.error('Error signing in after password reset:', signInError.message);
                    } else {
                      console.log('Sign in successful after password reset');
                    }
                  }
                } catch (resetFuncError) {
                  console.error('Function reset_user_password not available');
                }
              } else {
                console.log('User not found in public.users');
              }
            }
          } else if (robustData && robustData.success) {
            console.log('User created successfully with robust function:', robustData);
            
            // Try to sign in with the new user
            console.log('Attempting to sign in with newly created user');
            
            const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (newSignInError) {
              console.error('Error signing in with new user:', newSignInError.message);
            } else {
              console.log('Sign in successful with new user');
            }
          }
        } else {
          console.log('User created successfully with admin API:', adminData);
          
          // Try to sign in with the new user
          console.log('Attempting to sign in with newly created user');
          
          const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (newSignInError) {
            console.error('Error signing in with new user:', newSignInError.message);
          } else {
            console.log('Sign in successful with new user');
          }
        }
      }
    }
  } catch (error) {
    console.error('Exception checking user:', error);
  }
}

// Run the function
checkUser()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 