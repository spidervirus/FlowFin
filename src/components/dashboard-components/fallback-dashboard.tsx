'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { createSupabaseClient } from '@/lib/supabase-client';

export default function FallbackDashboard() {
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const createSettings = async () => {
      try {
        console.log("Creating company settings from fallback dashboard");
        
        // Get the current user from Supabase
        const supabase = createClient();
        const supabaseClient = createSupabaseClient();
        
        // First check if we have a valid session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.log("No valid session found, cannot create company settings");
          setError("No valid session found");
          setIsCreating(false);
          return;
        }
        
        // Get the user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData?.user?.id) {
          console.error("Error getting current user:", userError);
          setError("Error getting current user");
          setIsCreating(false);
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
          console.log("Company settings already exist, reloading page");
          setSuccess(true);
          
          // Reload the page to show the dashboard
          window.location.reload();
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
          setIsCreating(false);
          return;
        }
        
        console.log("Successfully created company settings");
        setSuccess(true);
        
        // Reload the page to show the dashboard
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        console.error("Error creating company settings:", err);
        setError(err.message || "An error occurred while creating company settings");
        setIsCreating(false);
      }
    };
    
    createSettings();
  }, []);
  
  if (isCreating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Setting Up Your Dashboard</CardTitle>
            <CardDescription>
              We're creating your company settings...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Setup Error</CardTitle>
            <CardDescription>
              There was an error setting up your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500 mb-4">
              {error}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/setup'} className="w-full">
              Go to Setup
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Complete</CardTitle>
          <CardDescription>
            Your company settings have been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            You will be redirected to the dashboard shortly.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()} className="w-full">
            Reload Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}