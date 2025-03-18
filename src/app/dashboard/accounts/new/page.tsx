"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { CurrencyCode } from "@/lib/utils";

// Define a minimal user type for our purposes
interface MinimalUser {
  id: string;
  email?: string;
}

export default function NewAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('USD');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    balance: '',
    currency: '',
    institution: '',
    account_number: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Check if user is authenticated
        const supabaseClient = createSupabaseClient();
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        let effectiveUser: MinimalUser | null = user ? { id: user.id, email: user.email } : null;
        
        // If no user from Supabase, try to get from localStorage
        if (!effectiveUser) {
          console.log("No user from Supabase, checking localStorage");
          
          // Try to get user ID from localStorage
          const userId = localStorage.getItem("currentUserId");
          const userDataStr = localStorage.getItem("userData");
          let userDataId = null;
          
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData?.user?.id) {
                userDataId = userData.user.id;
              }
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }
          
          if (userId || userDataId) {
            // Create a minimal user object with the ID
            effectiveUser = {
              id: userId || userDataId || "",
              email: "user@example.com" // Placeholder email
            };
            console.log("Using user ID from localStorage:", effectiveUser.id);
            
            // Try to refresh the session
            try {
              supabaseClient.auth.refreshSession();
            } catch (refreshError) {
              console.error("Error refreshing session:", refreshError);
            }
          } else {
            console.log("No user ID found in localStorage, redirecting to sign-in");
            router.push('/sign-in');
            return;
          }
        }
        
        setUser(effectiveUser);
        
        // Get company settings
        const { data: settingsData, error: settingsError } = await supabaseClient
          .from('company_settings')
          .select('*')
          .eq('user_id', effectiveUser.id)
          .single();
        
        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
        }
        
        // Set currency from settings or default to USD
        const currency = settingsData?.default_currency as CurrencyCode || 'USD';
        setDefaultCurrency(currency);
        setFormData(prev => ({ ...prev, currency }));
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validate form data
      if (!formData.name || !formData.type || !formData.balance) {
        alert('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Get user ID
      let userId = user?.id || '';
      
      // If no user ID from state, try to get from localStorage
      if (!userId) {
        const localUserId = localStorage.getItem("currentUserId");
        if (localUserId) {
          userId = localUserId;
        } else {
          // Try to get from userData if not found directly
          const userDataStr = localStorage.getItem("userData");
          
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData?.user?.id) {
                userId = userData.user.id;
              }
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }
        }
        
        if (!userId) {
          alert("User ID not found. Please sign in again.");
          router.push('/sign-in');
          return;
        }
      }
      
      // Create account directly with Supabase client
      const supabaseClient = createSupabaseClient();
      
      console.log("Creating account with data:", {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance),
        currency: formData.currency || defaultCurrency,
        institution: formData.institution || undefined,
        account_number: formData.account_number || undefined,
        notes: formData.notes || undefined,
        user_id: userId,
      });
      
      const { data, error } = await supabaseClient
        .from("accounts")
        .insert([
          {
            name: formData.name,
            type: formData.type,
            balance: parseFloat(formData.balance),
            currency: formData.currency || defaultCurrency,
            institution: formData.institution || undefined,
            account_number: formData.account_number || undefined,
            notes: formData.notes || undefined,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();
      
      if (error) {
        console.error("Error creating account:", error);
        alert('Failed to create account: ' + error.message);
        setSubmitting(false);
        return;
      }
      
      console.log("Account created successfully:", data);
      
      // Store a flag in localStorage to indicate a refresh is needed
      localStorage.setItem("accountsNeedRefresh", "true");
      
      // Use router.push instead of direct window location to avoid full page reload
      // This will navigate to the accounts page and trigger the useEffect with the pathname change
      router.push('/dashboard/accounts');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while creating the account');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-[60vh]">
              <p className="text-lg">Loading...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/accounts">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">New Account</h1>
                <p className="text-muted-foreground">
                  Add a new financial account to track
                </p>
              </div>
            </div>
          </header>

          {/* Account Form */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Enter the details of your financial account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Chase Checking"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Account Type</Label>
                    <select 
                      id="type"
                      name="type" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select type</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit Card</option>
                      <option value="investment">Investment</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      name="balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.balance}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      name="currency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.currency || defaultCurrency}
                      onChange={handleChange}
                    >
                      <optgroup label="Major World Currencies">
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="CNY">CNY - Chinese Yuan</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </optgroup>
                      <optgroup label="European Currencies">
                        <option value="CHF">CHF - Swiss Franc</option>
                        <option value="SEK">SEK - Swedish Krona</option>
                        <option value="NOK">NOK - Norwegian Krone</option>
                        <option value="DKK">DKK - Danish Krone</option>
                        <option value="PLN">PLN - Polish Złoty</option>
                        <option value="CZK">CZK - Czech Koruna</option>
                        <option value="HUF">HUF - Hungarian Forint</option>
                        <option value="RON">RON - Romanian Leu</option>
                      </optgroup>
                      <optgroup label="Asian Currencies">
                        <option value="SGD">SGD - Singapore Dollar</option>
                        <option value="HKD">HKD - Hong Kong Dollar</option>
                        <option value="KRW">KRW - South Korean Won</option>
                        <option value="IDR">IDR - Indonesian Rupiah</option>
                        <option value="MYR">MYR - Malaysian Ringgit</option>
                        <option value="THB">THB - Thai Baht</option>
                        <option value="PHP">PHP - Philippine Peso</option>
                        <option value="VND">VND - Vietnamese Dong</option>
                      </optgroup>
                      <optgroup label="Middle Eastern Currencies">
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                        <option value="ILS">ILS - Israeli Shekel</option>
                        <option value="QAR">QAR - Qatari Riyal</option>
                        <option value="BHD">BHD - Bahraini Dinar</option>
                        <option value="KWD">KWD - Kuwaiti Dinar</option>
                        <option value="OMR">OMR - Omani Rial</option>
                      </optgroup>
                      <optgroup label="American Currencies">
                        <option value="MXN">MXN - Mexican Peso</option>
                        <option value="BRL">BRL - Brazilian Real</option>
                        <option value="ARS">ARS - Argentine Peso</option>
                        <option value="CLP">CLP - Chilean Peso</option>
                        <option value="COP">COP - Colombian Peso</option>
                        <option value="PEN">PEN - Peruvian Sol</option>
                      </optgroup>
                      <optgroup label="African Currencies">
                        <option value="ZAR">ZAR - South African Rand</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="EGP">EGP - Egyptian Pound</option>
                        <option value="MAD">MAD - Moroccan Dirham</option>
                        <option value="GHS">GHS - Ghanaian Cedi</option>
                      </optgroup>
                      <optgroup label="Oceanian Currencies">
                        <option value="NZD">NZD - New Zealand Dollar</option>
                        <option value="FJD">FJD - Fijian Dollar</option>
                        <option value="PGK">PGK - Papua New Guinean Kina</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution">Financial Institution</Label>
                    <Input
                      id="institution"
                      name="institution"
                      placeholder="e.g., Chase Bank"
                      value={formData.institution}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">
                      Account Number (Last 4 digits)
                    </Label>
                    <Input
                      id="account_number"
                      name="account_number"
                      placeholder="e.g., 1234"
                      maxLength={4}
                      value={formData.account_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Add any additional notes or details"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Link href="/dashboard/accounts">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={submitting}>
                    <Save className="mr-2 h-4 w-4" /> Save Account
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
