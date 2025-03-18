'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createSupabaseClient } from '@/lib/supabase-client';

export default function CreateCompanySettingsFixed() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const createSettings = async () => {
      // Check if we should create settings (based on URL parameter)
      const urlParams = new URLSearchParams(window.location.search);
      const setupComplete = urlParams.get('setupComplete') === 'true';
      
      if (!setupComplete) {
        return;
      }
      
      try {
        setIsCreating(true);
        console.log("Creating company settings from dashboard");
        
        // Get the current user from Supabase
        const supabase = createClient();
        const supabaseClient = createSupabaseClient();
        
        // First check if we have a valid session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.log("No valid session found, cannot create company settings");
          setError("No valid session found");
          return;
        }
        
        // Get the user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData?.user?.id) {
          console.error("Error getting current user:", userError);
          setError("Error getting current user");
          return;
        }
        
        const userId = userData.user.id;
        
        // Check if company settings already exist
        const { data: existingSettings, error: checkError } = await supabaseClient
          .from('company_settings')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (existingSettings) {
          console.log("Company settings already exist, no need to create");
          setSuccess(true);
          
          // Remove the setupComplete parameter from the URL without refreshing the page
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('setupComplete');
          window.history.replaceState({}, document.title, newUrl.toString());
          
          return;
        }
        
        // Create company settings
        const { error: createError } = await supabaseClient
          .from('company_settings')
          .insert({
            user_id: userId,
            company_name: "My Company",
            country: "United States",
            default_currency: "USD",
            fiscal_year_start: "01",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (createError) {
          console.error("Error creating company settings:", createError);
          setError("Error creating company settings");
          return;
        }
        
        console.log("Successfully created company settings");
        setSuccess(true);
        
        // Remove the setupComplete parameter from the URL without refreshing the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('setupComplete');
        window.history.replaceState({}, document.title, newUrl.toString());
        
        // Set a success message in sessionStorage
        sessionStorage.setItem("success", "Your account setup has been completed successfully!");
        
        // Reload the page to show the dashboard with the new settings
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        console.error("Error creating company settings:", err);
        setError(err.message || "An error occurred while creating company settings");
      } finally {
        setIsCreating(false);
      }
    };
    
    createSettings();
  }, []);
  
  // This component doesn't render anything visible
  return null;
} 