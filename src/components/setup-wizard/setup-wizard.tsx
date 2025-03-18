'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import SetupComplete from "./setup-complete";

// Map of countries to their default currencies
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'European Union': 'EUR',
  'Japan': 'JPY',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'China': 'CNY',
  'India': 'INR',
  'Switzerland': 'CHF',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'Hungary': 'HUF',
  'Romania': 'RON',
  'Singapore': 'SGD',
  'Hong Kong': 'HKD',
  'South Korea': 'KRW',
  'Indonesia': 'IDR',
  'Malaysia': 'MYR',
  'Thailand': 'THB',
  'Philippines': 'PHP',
  'Vietnam': 'VND',
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Israel': 'ILS',
  'Qatar': 'QAR',
  'Bahrain': 'BHD',
  'Kuwait': 'KWD',
  'Oman': 'OMR',
  'Mexico': 'MXN',
  'Brazil': 'BRL',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
  'South Africa': 'ZAR',
  'Nigeria': 'NGN',
  'Kenya': 'KES',
  'Egypt': 'EGP',
  'Morocco': 'MAD',
  'Ghana': 'GHS',
  'New Zealand': 'NZD',
  'Fiji': 'FJD',
  'Papua New Guinea': 'PGK'
};

interface SetupData {
  companyName: string;
  address: string;
  country: string;
  currency: CurrencyCode;
  fiscalYearStart: string;
  industry: string;
}

export default function SetupWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    companyName: '',
    address: '',
    country: '',
    currency: 'USD',
    fiscalYearStart: '',
    industry: '',
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleCountryChange = (country: string) => {
    const defaultCurrency = COUNTRY_CURRENCY_MAP[country] || 'USD';
    setSetupData(prev => ({
      ...prev,
      country,
      currency: defaultCurrency
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!setupData.companyName.trim()) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please enter your company name",
          });
          return false;
        }
        if (!setupData.industry) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your industry",
          });
          return false;
        }
        break;
      case 2:
        if (!setupData.country) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your country",
          });
          return false;
        }
        if (!setupData.address.trim()) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please enter your business address",
          });
          return false;
        }
        break;
      case 3:
        if (!setupData.fiscalYearStart) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your fiscal year start month",
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsLoading(true);
    const supabase = createBrowserClient();
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }

      if (!user) {
        throw new Error('No authenticated user found. Please sign in again.');
      }

      // Save company settings - use upsert instead of insert to handle existing records
      const { error: settingsError } = await supabase
        .from('company_settings')
        .upsert([{
          user_id: user.id,
          company_name: setupData.companyName,
          address: setupData.address,
          country: setupData.country,
          default_currency: setupData.currency,
          fiscal_year_start: setupData.fiscalYearStart,
          industry: setupData.industry || null
        }], { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (settingsError) {
        throw new Error(`Error saving company settings: ${settingsError.message}`);
      }

      // Store setup data in localStorage to help with the redirect
      localStorage.setItem("setupData", JSON.stringify({
        userId: user.id,
        companyName: setupData.companyName,
        currency: setupData.currency,
        setupComplete: true,
        timestamp: new Date().toISOString()
      }));

      // Create default categories for the company - only if they don't exist
      // First check if user already has categories
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
        
      // Only create default categories if user doesn't have any
      if (!existingCategories || existingCategories.length === 0) {
        const { error: categoriesError } = await supabase
          .from('categories')
          .insert([
            { name: 'Sales', type: 'income', user_id: user.id },
            { name: 'Services', type: 'income', user_id: user.id },
            { name: 'Salary', type: 'expense', user_id: user.id },
            { name: 'Rent', type: 'expense', user_id: user.id },
            { name: 'Utilities', type: 'expense', user_id: user.id },
            { name: 'Office Supplies', type: 'expense', user_id: user.id },
          ]);

        if (categoriesError) {
          console.warn('Error creating default categories:', categoriesError);
          // Continue anyway, as this is not critical
        }
      }

      // Show success message
      toast({
        title: "Setup Complete",
        description: "Your company has been set up successfully!",
      });

      console.log("Setup complete, preparing to redirect to dashboard...");
      
      // Mark setup as complete to show the setup complete screen
      setSetupComplete(true);

      // Redirect to the setup-redirect page which will handle the redirect to dashboard
      setTimeout(() => {
        console.log("Redirecting to setup-redirect page...");
        router.push('/setup-redirect');
      }, 2000);
    } catch (error) {
      console.error('Setup error:', error);
      
      // Provide a user-friendly error message
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('duplicate key value')) {
          errorMessage = "Your company profile already exists. Redirecting to dashboard...";
          
          // Store setup data in localStorage to help with the redirect
          try {
            localStorage.setItem("setupData", JSON.stringify({
              userId: 'existing-user',
              setupComplete: true,
              timestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.error("Error storing setup data in localStorage:", e);
          }
          
          // Mark setup as complete to show the setup complete screen
          setSetupComplete(true);
          
          // Redirect to the setup-redirect page which will handle the redirect to dashboard
          setTimeout(() => {
            console.log("Redirecting to setup-redirect page...");
            router.push('/setup-redirect');
          }, 2000);
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to FlowFin</CardTitle>
          <CardDescription>Let's set up your company profile</CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent>
          {setupComplete ? (
            <SetupComplete />
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={setupData.companyName}
                      onChange={(e) => setSetupData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={setupData.industry}
                      onValueChange={(value) => setSetupData(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={setupData.country}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(COUNTRY_CURRENCY_MAP).sort().map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="address">Business Address</Label>
                    <Input
                      id="address"
                      value={setupData.address}
                      onChange={(e) => setSetupData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter your business address"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={setupData.currency}
                      onValueChange={(value: CurrencyCode) => setSetupData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                          <SelectItem key={code} value={code}>
                            {config.symbol} {config.name} ({code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Default currency is set based on your country, but you can change it
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
                    <Select
                      value={setupData.fiscalYearStart}
                      onValueChange={(value) => setSetupData(prev => ({ ...prev, fiscalYearStart: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiscal year start" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">January</SelectItem>
                        <SelectItem value="04">April</SelectItem>
                        <SelectItem value="07">July</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {!setupComplete && (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
              >
                Back
              </Button>
              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 