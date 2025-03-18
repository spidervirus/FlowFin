'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupRedirect() {
  const router = useRouter();
  const [isCreatingSettings, setIsCreatingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Store setup data in localStorage with more complete information
    try {
      // Get any existing setup data from localStorage
      const existingDataStr = localStorage.getItem("setupData");
      let existingData = {};
      
      if (existingDataStr) {
        try {
          existingData = JSON.parse(existingDataStr);
        } catch (e) {
          console.error("Error parsing existing setup data:", e);
        }
      }
      
      // Create a more complete setup data object
      const setupData = {
        ...existingData,
        setupComplete: true,
        hasCompanySettings: true, // Add this flag to indicate company settings exist
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem("setupData", JSON.stringify(setupData));
      console.log("Enhanced setup data stored in localStorage:", setupData);
      
      // Also set a session storage flag for immediate use
      sessionStorage.setItem("setupComplete", "true");
    } catch (e) {
      console.error("Error storing setup data in localStorage:", e);
    }

    // First check if company settings already exist
    const checkCompanySettings = async () => {
      try {
        console.log("Checking if company settings already exist");
        const response = await fetch('/api/check-company-settings');
        const data = await response.json();
        
        if (data.exists) {
          console.log("Company settings already exist, redirecting to dashboard");
          window.location.href = '/dashboard';
          return true;
        }
        
        console.log("Company settings don't exist, need to create them");
        return false;
      } catch (error) {
        console.error("Error checking company settings:", error);
        return false;
      }
    };

    // Create company settings directly
    const createCompanySettings = async () => {
      // First check if company settings already exist
      const settingsExist = await checkCompanySettings();
      if (settingsExist) {
        return; // No need to create settings if they already exist
      }
      
      try {
        setIsCreatingSettings(true);
        
        // First test if the service role key is working
        console.log("Testing service role key");
        const testResponse = await fetch('/api/test-service-role', {
          method: 'GET',
        });
        
        const testData = await testResponse.json();
        console.log("Service role test response:", testData);
        
        if (!testResponse.ok) {
          console.error('Error testing service role key:', testData);
          throw new Error(testData.error || 'Service role key is not working');
        }
        
        // Try the simple API route first
        console.log("Calling simple API to create company settings");
        const simpleResponse = await fetch('/api/create-company-settings-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const simpleData = await simpleResponse.json();
        console.log("Simple API response:", simpleData);
        
        if (simpleResponse.ok) {
          console.log('Company settings created successfully with simple API:', simpleData);
          
          // Redirect to dashboard after creating settings
          window.location.href = '/dashboard';
          return;
        }
        
        console.error('Error response from simple API, trying direct API:', simpleData);
        
        // Try the direct API route next
        console.log("Calling direct API to create company settings");
        const directResponse = await fetch('/api/create-company-settings-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const directData = await directResponse.json();
        console.log("Direct API response:", directData);
        
        if (directResponse.ok) {
          console.log('Company settings created successfully with direct API:', directData);
          
          // Redirect to dashboard after creating settings
          window.location.href = '/dashboard';
          return;
        }
        
        console.error('Error response from direct API, trying raw SQL API:', directData);
        
        // Try the raw SQL API route next
        console.log("Calling raw SQL API to create company settings");
        const rawResponse = await fetch('/api/create-company-settings-raw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const rawData = await rawResponse.json();
        console.log("Raw SQL API response:", rawData);
        
        if (rawResponse.ok) {
          console.log('Company settings created successfully with raw SQL API:', rawData);
          
          // Redirect to dashboard after creating settings
          window.location.href = '/dashboard';
          return;
        }
        
        console.error('Error response from raw SQL API, trying SQL function API:', rawData);
        
        // Try the SQL-based API route next
        console.log("Calling SQL function API to create company settings");
        const sqlResponse = await fetch('/api/create-company-settings-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const sqlData = await sqlResponse.json();
        console.log("SQL function API response:", sqlData);
        
        if (sqlResponse.ok) {
          console.log('Company settings created successfully with SQL function API:', sqlData);
          
          // Redirect to dashboard after creating settings
          window.location.href = '/dashboard';
          return;
        }
        
        console.error('Error response from SQL function API, trying regular API:', sqlData);
        
        // If all other APIs fail, try the regular API
        console.log("Calling regular API to create company settings");
        const response = await fetch('/api/create-company-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        console.log("Regular API response:", data);
        
        if (!response.ok) {
          console.error('Error response from regular API:', data);
          throw new Error(data.error || 'Failed to create company settings');
        }
        
        console.log('Company settings created successfully with regular API:', data);
        
        // Redirect to dashboard after creating settings
        window.location.href = '/dashboard';
      } catch (err: any) {
        console.error('Error creating company settings:', err);
        setError(err.message || 'An error occurred');
        
        // Show the error for a few seconds before redirecting
        setTimeout(() => {
          // Redirect to dashboard with setupComplete parameter as fallback
          window.location.href = '/dashboard?setupComplete=true';
        }, 5000); // Increased to 5 seconds to give more time to see the error
      } finally {
        setIsCreatingSettings(false);
      }
    };
    
    createCompanySettings();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Setup Complete!</h1>
        <p className="mb-2">Your company has been set up successfully.</p>
        {isCreatingSettings ? (
          <p className="mb-4">Creating company settings...</p>
        ) : error ? (
          <>
            <p className="mb-4 text-red-500">{error}</p>
            <p className="mb-4">Redirecting to dashboard...</p>
          </>
        ) : (
          <p className="mb-4">Redirecting to dashboard...</p>
        )}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => window.location.href = '/dashboard?setupComplete=true'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={isCreatingSettings}
          >
            {isCreatingSettings ? 'Creating Settings...' : 'Go to Dashboard'}
          </button>
          <button 
            onClick={async () => {
              try {
                setIsCreatingSettings(true);
                setError(null);
                
                // First check if company settings already exist
                console.log("Checking if company settings already exist");
                const checkResponse = await fetch('/api/check-company-settings');
                const checkData = await checkResponse.json();
                
                if (checkData.exists) {
                  console.log("Company settings already exist, redirecting to dashboard");
                  window.location.href = '/dashboard';
                  return;
                }
                
                // Try the simple API route
                const response = await fetch('/api/create-company-settings-simple', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  console.log('Company settings created successfully:', data);
                  window.location.href = '/dashboard';
                } else {
                  throw new Error(data.error || 'Failed to create company settings');
                }
              } catch (err: any) {
                console.error('Error creating company settings:', err);
                setError(err.message || 'An error occurred');
              } finally {
                setIsCreatingSettings(false);
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            disabled={isCreatingSettings}
          >
            Create Settings Manually
          </button>
        </div>
      </div>
    </div>
  );
} 