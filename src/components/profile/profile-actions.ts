"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

interface UpdateProfileParams {
  userId: string;
  fullName: string;
  email: string;
}

export async function updateUserProfile({ userId, fullName, email }: UpdateProfileParams) {
  const serviceClient = createServiceRoleClient();
  
  try {
    // First try updating the main users table
    const { data: mainData, error: mainError } = await serviceClient
      .from('users')
      .update({
        full_name: fullName,
        name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (mainError && mainError.code !== 'PGRST116') {
      console.error('Error updating main profile:', mainError);
      
      // If not found in main, try updating backup
      const { data: backupData, error: backupError } = await serviceClient
        .from('user_profiles_backup')
        .update({
          full_name: fullName,
          name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (backupError) {
        console.error('Error updating backup profile:', backupError);
        return {
          success: false,
          message: backupError.message
        };
      }
    }
    
    // Try updating user metadata in auth system
    try {
      const { error: metadataError } = await serviceClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { full_name: fullName }
        }
      );
      
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Continue anyway as the profile was updated
      }
    } catch (metadataError) {
      console.error('Exception updating user metadata:', metadataError);
      // Continue anyway as the profile was updated
    }
    
    // Try updating manual registry if it exists
    try {
      const { error: manualError } = await serviceClient
        .from('manual_user_registry')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (manualError && manualError.code !== 'PGRST116') {
        console.error('Error updating manual registry:', manualError);
        // Continue anyway as the profile was updated in other tables
      }
    } catch (manualError) {
      console.error('Exception updating manual registry:', manualError);
      // Continue anyway as the profile was updated in other tables
    }
    
    return {
      success: true,
      message: "Profile updated successfully"
    };
  } catch (error) {
    console.error('Exception updating profile:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 