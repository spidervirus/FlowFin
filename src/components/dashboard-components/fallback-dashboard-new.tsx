'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function FallbackDashboardNew() {
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const createSettings = async () => {
      try {
        console.log("Creating company settings from fallback dashboard");
        
        // Use the API route to create company settings
        const response = await fetch('/api/create-company-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error response from API:', data);
          throw new Error(data.error || 'Failed to create company settings');
        }
        
        console.log("Successfully created company settings:", data);
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