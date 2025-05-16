"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/app/types/supabase";
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
import { createClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import SetupComplete from "./setup-complete";

// Map of countries to their default currencies
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  "United States": "USD",
  "United Kingdom": "GBP",
  "European Union": "EUR",
  Japan: "JPY",
  Canada: "CAD",
  Australia: "AUD",
  China: "CNY",
  India: "INR",
  Switzerland: "CHF",
  Sweden: "SEK",
  Norway: "NOK",
  Denmark: "DKK",
  Poland: "PLN",
  "Czech Republic": "CZK",
  Hungary: "HUF",
  Romania: "RON",
  Singapore: "SGD",
  "Hong Kong": "HKD",
  "South Korea": "KRW",
  Indonesia: "IDR",
  Malaysia: "MYR",
  Thailand: "THB",
  Philippines: "PHP",
  Vietnam: "VND",
  UAE: "AED",
  "Saudi Arabia": "SAR",
  Israel: "ILS",
  Qatar: "QAR",
  Bahrain: "BHD",
  Kuwait: "KWD",
  Oman: "OMR",
  Mexico: "MXN",
  Brazil: "BRL",
  Argentina: "ARS",
  Chile: "CLP",
  Colombia: "COP",
  Peru: "PEN",
  "South Africa": "ZAR",
  Nigeria: "NGN",
  Kenya: "KES",
  Egypt: "EGP",
  Morocco: "MAD",
  Ghana: "GHS",
  "New Zealand": "NZD",
  Fiji: "FJD",
  "Papua New Guinea": "PGK",
};

// Add these constants at the top of the file after the COUNTRY_CURRENCY_MAP
const DEPARTMENTS = [
  "Executive",
  "Finance",
  "Operations",
  "Human Resources",
  "Sales",
  "Marketing",
  "Technology",
  "Product",
  "Customer Service",
  "Legal",
  "Research & Development",
  "Other"
] as const;

const JOB_TITLES = [
  "CEO",
  "CFO",
  "COO",
  "CTO",
  "Finance Manager",
  "Financial Controller",
  "Accountant",
  "Operations Manager",
  "HR Manager",
  "Sales Manager",
  "Marketing Manager",
  "IT Manager",
  "Product Manager",
  "Business Analyst",
  "Other"
] as const;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid.trim());
}

function normalizeUUID(id: string): string {
  if (!id) {
    throw new Error('ID cannot be empty');
  }

  // If it's already a valid UUID, return it
  if (isValidUUID(id.trim())) {
    return id.trim().toLowerCase();
  }

  // Remove any non-alphanumeric characters and convert to lowercase
  const normalized = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Check if we have enough characters for a UUID
  if (normalized.length !== 32) {
    throw new Error(`Invalid ID length: ${normalized.length} (expected 32 characters)`);
  }
  
  // Format as UUID
  const uuid = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
  
  // Validate the formatted UUID
  if (!isValidUUID(uuid)) {
    throw new Error('Failed to create valid UUID from input');
  }
  
  return uuid;
}

interface ProfileApiResponse {
  id?: string;
  error?: string;
}

interface SetupData {
  fullName: string;
  companyName: string;
  industry: string;
  companySize: string;
  phoneNumber: string;
  country: string;
  currency: CurrencyCode;
  fiscalYearStart: string;
  jobTitle: string;
  department: string;
  address: string;
}

type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

interface Category {
  name: string;
  type: "income" | "expense";
  user_id: string;
  is_active: boolean;
  is_default: boolean;
  color?: string | null;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Helper function to get session with retries
async function getSessionWithRetries(supabase: any, maxRetries = 3) {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error(`Session error (attempt ${retryCount + 1}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        throw new Error(`Authentication error after ${maxRetries} attempts: ${error.message}`);
      }

      return session;
    } catch (error) {
      console.error(`Session retrieval error (attempt ${retryCount + 1}):`, error);
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error("Failed to get session after multiple attempts");
}

export default function SetupWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    fullName: '',
    companyName: '',
    industry: '',
    companySize: '',
    phoneNumber: '',
    country: '',
    currency: 'USD' as CurrencyCode,
    fiscalYearStart: '',
    jobTitle: '',
    department: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Initialize Supabase client
  const supabase = createBrowserClient();

  useEffect(() => {
    // Check session and organization status on mount
    const initializeSetup = async () => {
      try {
        const session = await getSessionWithRetries(supabase);
        
        if (!session?.user) {
          console.log("No valid session found, redirecting to login...");
          router.push("/login");
          return;
        }

        setSession(session);

        // Check if user has an organization
        const { data: orgMembers, error: orgError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (orgError) {
          console.error("Error checking organization membership:", orgError);
          throw new Error("Failed to check organization membership");
        }

        const hasOrg = orgMembers && orgMembers.length > 0;
        setHasOrganization(hasOrg);
        
        if (hasOrg) {
          console.log("User already has an organization, redirecting to dashboard...");
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Setup initialization error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in again to continue.",
        });
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        setSession(session);
      }
    });

    initializeSetup();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCountryChange = (country: string) => {
    const defaultCurrency = COUNTRY_CURRENCY_MAP[country] || "USD";
    setSetupData((prev) => ({
      ...prev,
      country,
      currency: defaultCurrency as CurrencyCode,
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!setupData.fullName.trim()) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please enter your full name",
          });
          return false;
        }
        if (!setupData.jobTitle.trim()) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your job title",
          });
          return false;
        }
        if (!setupData.department.trim()) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your department",
          });
          return false;
        }
        break;

      case 2:
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
        if (!setupData.companySize) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your company size",
          });
          return false;
        }
        if (!setupData.phoneNumber.trim()) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please enter your company phone number",
          });
          return false;
        }
        break;

      case 3:
        if (!setupData.country) {
          toast({
            variant: "destructive",
            title: "Required Field",
            description: "Please select your country",
          });
          return false;
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting organization creation process...');

      // Ensure we have a valid session
      if (!session?.user?.id) {
        console.error('No valid session found:', { session });
        throw new Error('No valid session found. Please log in again.');
      }
      console.log('Session validated:', { userId: session.user.id });
      
      // Validate fiscal year start
      const month = parseInt(setupData.fiscalYearStart);
      console.log('Parsing fiscal year start:', { 
        original: setupData.fiscalYearStart,
        parsed: month,
        isValid: !isNaN(month) && month >= 1 && month <= 12 
      });

      if (isNaN(month) || month < 1 || month > 12) {
        throw new Error('Invalid fiscal year start month. Please select a valid month.');
      }

      // Format fiscal year start as 2-digit month
      const formattedFiscalYearStart = setupData.fiscalYearStart.padStart(2, '0');
      console.log('Prepared fiscal year start:', {
        original: setupData.fiscalYearStart,
        formatted: formattedFiscalYearStart
      });

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhoneNumber = setupData.phoneNumber.replace(/\s+/g, '');
      console.log('Validating phone number:', {
        original: setupData.phoneNumber,
        cleaned: cleanPhoneNumber,
        isValid: phoneRegex.test(cleanPhoneNumber)
      });

      if (!phoneRegex.test(cleanPhoneNumber)) {
        throw new Error('Invalid phone number format. Please enter a valid international phone number.');
      }

      // Prepare company settings with data validation
      const companySettings = {
        user_id: session.user.id,
        company_name: setupData.companyName.trim(),
        phone_number: cleanPhoneNumber,
        country: setupData.country.trim(),
        default_currency: setupData.currency,
        fiscal_year_start: formattedFiscalYearStart,
        industry: setupData.industry.toUpperCase(), // Ensure industry is uppercase
        company_size: setupData.companySize.trim()
      };

      // Log the complete setup data for debugging
      console.log('Complete setup data:', setupData);
      console.log('Prepared company settings:', companySettings);

      // Validate all required fields
      const requiredFields = Object.entries(companySettings);
      console.log('Validating required fields...');
      for (const [key, value] of requiredFields) {
        console.log(`Checking ${key}:`, { value, isValid: !!value });
        if (!value) {
          throw new Error(`${key.replace(/_/g, ' ')} is required`);
        }
      }

      // Create company settings
      console.log('Sending request to create company settings...');
      const response = await fetch('/api/setup/company-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(companySettings),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create company settings');
        } else {
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          throw new Error('Server returned an invalid response format');
        }
      }

      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log('API Response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (!responseData.settings?.id) {
        console.error('Missing settings ID in response:', responseData);
        throw new Error('No settings data returned from the server');
      }

      // Save organization ID to localStorage
      try {
        localStorage.setItem('organizationId', responseData.settings.id);
        console.log('Organization ID saved to localStorage:', responseData.settings.id);
      } catch (storageError) {
        console.error('Failed to save organization ID to localStorage:', storageError);
        // Continue execution as this is not a critical error
      }

      setSetupComplete(true);
      toast({
        title: "Success!",
        description: "Your organization has been created successfully.",
        variant: "default",
      });
      console.log('Organization creation process completed successfully');

    } catch (error) {
      console.error('Organization creation failed:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
          <CardDescription>
            Let&apos;s set up your company profile
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : setupComplete ? (
            <SetupComplete />
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Your Full Name</Label>
                    <Input
                      id="fullName"
                      value={setupData.fullName}
                      onChange={(e) =>
                        setSetupData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Select
                      value={setupData.jobTitle}
                      onValueChange={(value) =>
                        setSetupData((prev) => ({ ...prev, jobTitle: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your job title" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TITLES.map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={setupData.department}
                      onValueChange={(value) =>
                        setSetupData((prev) => ({ ...prev, department: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={setupData.companyName}
                      onChange={(e) =>
                        setSetupData((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={setupData.industry}
                      onValueChange={(value) =>
                        setSetupData((prev) => ({ ...prev, industry: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                        <SelectItem value="RETAIL">Retail</SelectItem>
                        <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                        <SelectItem value="SERVICES">Services</SelectItem>
                        <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                        <SelectItem value="FINANCE">Finance</SelectItem>
                        <SelectItem value="EDUCATION">Education</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={setupData.companySize}
                      onValueChange={(value) =>
                        setSetupData((prev) => ({ ...prev, companySize: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={setupData.phoneNumber}
                      onChange={(e) =>
                        setSetupData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter your company phone number"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Business Address</Label>
                    <Input
                      id="address"
                      value={setupData.address}
                      onChange={(e) =>
                        setSetupData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Enter your business address"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
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
                        {Object.keys(COUNTRY_CURRENCY_MAP)
                          .sort()
                          .map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={setupData.currency}
                      onValueChange={(value: CurrencyCode) =>
                        setSetupData((prev) => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CURRENCY_CONFIG).map(
                          ([code, config]) => (
                            <SelectItem key={code} value={code}>
                              {config.symbol} {config.name} ({code})
                            </SelectItem>
                          ),
                        )}
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
                      onValueChange={(value) =>
                        setSetupData((prev) => ({
                          ...prev,
                          fiscalYearStart: value,
                        }))
                      }
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
                    "Complete Setup"
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
