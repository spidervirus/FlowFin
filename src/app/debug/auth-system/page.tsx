import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from "../../../../supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminFunctionCreator, AuthSystemChecker, AuthIssuesDiagnoser, UserCreationTester } from './debug-client';

async function checkAuthSystem(formData: FormData) {
  'use server';
  
  const serviceClient = createServiceRoleClient();
  
  try {
    // Check if we can query auth.users() directly
    const { data: authUsersData, error: authUsersError } = await serviceClient.rpc(
      'admin_check_auth_users'
    );
    
    return {
      authUsers: {
        success: !authUsersError,
        message: authUsersError ? authUsersError.message : 'Successfully queried auth.users()',
        data: authUsersData
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testUserCreation(formData: FormData) {
  'use server';
  
  const serviceClient = createServiceRoleClient();
  
  try {
    // Generate a test email with timestamp to ensure uniqueness
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    console.log(`Testing user creation with email: ${testEmail}`);
    
    // Try to create a test user directly with admin API
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (error) {
      console.error('Error creating test user:', error);
      return {
        success: false,
        message: `Failed to create test user: ${error.message}`,
        error: error
      };
    }
    
    console.log('Test user created successfully:', data.user.id);
    
    // If successful, delete the test user
    if (data.user) {
      try {
        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
          data.user.id
        );
        
        if (deleteError) {
          console.error('Error deleting test user:', deleteError);
          return {
            success: true,
            message: `User created successfully but couldn't be deleted: ${deleteError.message}`,
            user: data.user
          };
        }
        
        console.log('Test user deleted successfully');
        return {
          success: true,
          message: 'Test user created and deleted successfully',
          user: data.user
        };
      } catch (deleteError) {
        console.error('Exception deleting test user:', deleteError);
        return {
          success: true,
          message: 'Test user created but exception occurred during deletion',
          user: data.user,
          deleteError: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        };
      }
    }
    
    return {
      success: true,
      message: 'Test completed, but no user data returned',
      data: data
    };
  } catch (error) {
    console.error('Exception testing user creation:', error);
    return {
      success: false,
      message: 'Exception occurred during test',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function createAdminFunction(formData: FormData) {
  'use server';
  
  const serviceClient = createServiceRoleClient();
  
  try {
    // Create a function to check auth.users directly
    const { error } = await serviceClient.rpc('create_admin_check_function');
    
    if (error) {
      console.error('Error creating admin check function:', error);
      return {
        success: false,
        message: `Failed to create admin function: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Admin check function created successfully'
    };
  } catch (error) {
    console.error('Exception creating admin function:', error);
    return {
      success: false,
      message: 'Exception occurred while creating admin function',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function diagnoseAuthIssues(formData: FormData) {
  'use server';
  
  const serviceClient = createServiceRoleClient();
  
  try {
    // Run the diagnose_auth_issues function
    const { data, error } = await serviceClient.rpc('diagnose_auth_issues');
    
    if (error) {
      console.error('Error diagnosing auth issues:', error);
      return {
        success: false,
        message: `Failed to diagnose auth issues: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Auth diagnostics completed',
      data: data
    };
  } catch (error) {
    console.error('Exception diagnosing auth issues:', error);
    return {
      success: false,
      message: 'Exception occurred while diagnosing auth issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default async function AuthSystemDebugPage() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect('/sign-in');
  }
  
  // Only allow access to this page for specific emails (for security)
  const allowedEmails = ['admin@example.com', 'amanmohammedali@outlook.com'];
  if (!allowedEmails.includes(user.email || '') && !user.email?.includes('admin')) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Auth System Diagnostics</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <AdminFunctionCreator createAdminFunction={createAdminFunction} />
        <AuthSystemChecker checkAuthSystem={checkAuthSystem} />
        <AuthIssuesDiagnoser diagnoseAuthIssues={diagnoseAuthIssues} />
        <UserCreationTester testUserCreation={testUserCreation} />
      </div>
    </div>
  );
} 