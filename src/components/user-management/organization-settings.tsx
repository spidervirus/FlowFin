"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from "next/navigation";
import { Building2, Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { User } from '@supabase/supabase-js';

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

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  address: string | null;
  country: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  company_name: string;
  industry: string;
  address: string;
  country: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
}

interface OrganizationSettingsProps {
  initialUser: User;
}

export default function OrganizationSettings({ initialUser }: OrganizationSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    company_name: "",
    industry: "",
    address: "",
    country: "",
    default_currency: "USD",
    fiscal_year_start: "01",
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!initialUser?.id) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Please sign in to access company settings",
          });
          router.push('/sign-in');
          return;
        }

        await fetchSettings(initialUser.id);
      } catch (error) {
        console.error("Initialization error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize settings",
        });
      }
    };
    
    initializeData();
  }, [initialUser, router]);

  const fetchSettings = async (userId: string) => {
    try {
      const supabaseClient = createSupabaseClient();
      const { data: settings, error } = await supabaseClient
        .from('company_settings')
        .select('*')
        .eq('user_id', userId)
        .single() as { data: CompanySettings | null; error: any };

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const { data: newSettings, error: createError } = await supabaseClient
            .from('company_settings')
            .insert([{
              user_id: userId,
              company_name: 'My Company',
              country: 'United States',
              default_currency: 'USD' as CurrencyCode,
              fiscal_year_start: '01',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single() as { data: CompanySettings | null; error: any };

          if (createError) throw createError;
          if (newSettings) {
            setFormData({
              company_name: newSettings.company_name,
              industry: newSettings.industry || '',
              address: newSettings.address || '',
              country: newSettings.country,
              default_currency: newSettings.default_currency,
              fiscal_year_start: newSettings.fiscal_year_start,
            });
          }
        } else {
          throw error;
        }
      } else if (settings) {
        setFormData({
          company_name: settings.company_name,
          industry: settings.industry || '',
          address: settings.address || '',
          country: settings.country,
          default_currency: settings.default_currency,
          fiscal_year_start: settings.fiscal_year_start,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load company settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'country') {
      const defaultCurrency = COUNTRY_CURRENCY_MAP[value] || 'USD';
      setFormData(prev => ({
        ...prev,
        country: value,
        default_currency: defaultCurrency as CurrencyCode
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialUser?.id) return;
    
    setIsSubmitting(true);

    try {
      const supabaseClient = createSupabaseClient();
      
      // Update company settings
      const { error: settingsError } = await supabaseClient
        .from('company_settings')
        .update({
          company_name: formData.company_name,
          industry: formData.industry,
          address: formData.address,
          country: formData.country,
          default_currency: formData.default_currency,
          fiscal_year_start: formData.fiscal_year_start,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', initialUser.id);

      if (settingsError) throw settingsError;

      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });

      router.refresh();
    } catch (error) {
      console.error("Error saving company settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update company settings",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>
              Manage your company information and preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleSelectChange("industry", value)}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="services">Professional Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleSelectChange("country", value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COUNTRY_CURRENCY_MAP).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_currency">Default Currency</Label>
              <Select
                value={formData.default_currency}
                onValueChange={(value) => handleSelectChange("default_currency", value)}
              >
                <SelectTrigger id="default_currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Company address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
              <Select
                value={formData.fiscal_year_start}
                onValueChange={(value) => handleSelectChange("fiscal_year_start", value)}
              >
                <SelectTrigger id="fiscal_year_start">
                  <SelectValue placeholder="Select fiscal year start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Company Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          These settings affect how your financial data is processed and displayed.
          Make sure to keep them up to date.
        </p>
      </CardFooter>
    </Card>
  );
}
