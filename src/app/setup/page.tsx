import { Metadata } from 'next';
import SetupWizard from '@/components/setup-wizard/setup-wizard';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '../../../supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Setup - FlowFin',
  description: 'Complete your company setup to get started with FlowFin',
};

export default async function SetupPage() {
  const supabase = await createClient();
  const serviceClient = createServiceRoleClient();

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      redirect('/sign-in');
    }

    if (!user) {
      redirect('/sign-in');
    }

    // Check if the user profile exists
    try {
      const { data: userProfile, error: profileError } = await serviceClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      // Create the user profile if it doesn't exist
      if (!userProfile && (!profileError || profileError.code === 'PGRST116')) {
        // Create a minimal user profile - the triggers will handle the rest
        const { error: insertError } = await serviceClient
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || '',
            full_name: user.user_metadata?.full_name || '',
          });

        if (insertError) {
          console.error("Error creating user profile:", insertError);
          // Continue anyway, as the setup wizard will handle company settings
        }
      }
    } catch (profileCheckError) {
      console.error("Error in profile check/creation:", profileCheckError);
      // Continue to setup wizard even if profile check fails
    }

    // Check if setup is already completed
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('id')
        .single();

      if (settings) {
        redirect('/dashboard');
      }
    } catch (settingsCheckError) {
      // This is likely a redirect error, which is expected behavior
      // Only log real errors, not redirect "errors"
      if (!(settingsCheckError instanceof Error) || 
          !settingsCheckError.message.includes('NEXT_REDIRECT')) {
        console.error("Error checking company settings:", settingsCheckError);
      }
      // Continue to setup wizard even if settings check fails
    }

    return <SetupWizard />;
  } catch (error) {
    console.error("Unexpected error in setup page:", error);
    redirect('/sign-in');
  }
} 