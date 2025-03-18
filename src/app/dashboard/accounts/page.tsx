"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Edit, Trash, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import DashboardWrapper from "../dashboard-wrapper";

// Define a minimal user type for our purposes
interface MinimalUser {
  id: string;
  email?: string;
}

// Define account type
interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [assets, setAssets] = useState(0);
  const [liabilities, setLiabilities] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to force refresh data
  const refreshData = () => {
    console.log("Forcing data refresh");
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Function to directly fetch accounts data for a user
  const fetchAccountsForUser = async (userId: string) => {
    console.log("Directly fetching accounts for user:", userId);
    try {
      const supabaseClient = createSupabaseClient();
      const { data, error } = await supabaseClient
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("name");
        
      if (error) {
        console.error("Error in direct fetch:", error);
        return [];
      }
      
      console.log(`Direct fetch returned ${data?.length || 0} accounts:`, data);
      return data || [];
    } catch (err) {
      console.error("Exception in direct fetch:", err);
      return [];
    }
  };

  // Function to create default accounts for new users
  const createDefaultAccounts = async (userId: string) => {
    const supabaseClient = createSupabaseClient();
    
    // Check if user already has any accounts
    const { data: existingAccounts } = await supabaseClient
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existingAccounts && existingAccounts.length > 0) {
      return; // User already has accounts, don't create defaults
    }

    // Create default accounts
    const defaultAccounts = [
      {
        name: "Cash on Hand",
        type: "cash",
        balance: 0,
        currency: currency,
        user_id: userId,
        notes: "Physical cash and other liquid assets"
      },
      {
        name: "Cash at Bank",
        type: "checking",
        balance: 0,
        currency: currency,
        user_id: userId,
        notes: "Primary bank account"
      }
    ];

    const { error } = await supabaseClient
      .from("accounts")
      .insert(defaultAccounts);

    if (error) {
      console.error("Error creating default accounts:", error);
    } else {
      // Refresh the accounts list
      refreshData();
    }
  };

  // Force a refresh when the component mounts or when returning to this page
  useEffect(() => {
    console.log("Accounts page mounted or pathname changed");
    
    // Check if we need to refresh based on localStorage flag
    const needsRefresh = localStorage.getItem("accountsNeedRefresh") === "true";
    if (needsRefresh) {
      console.log("Found accountsNeedRefresh flag, clearing and refreshing");
      // Clear the flag
      localStorage.removeItem("accountsNeedRefresh");
      
      // If we have a user ID in localStorage, do a direct fetch
      const userId = localStorage.getItem("currentUserId");
      const userDataStr = localStorage.getItem("userData");
      let effectiveUserId = userId;
      
      if (!effectiveUserId && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData?.user?.id) {
            effectiveUserId = userData.user.id;
          }
        } catch (e) {
          console.error("Error parsing userData:", e);
        }
      }
      
      if (effectiveUserId) {
        console.log("Doing direct fetch for user:", effectiveUserId);
        // Do a direct fetch and update the accounts
        fetchAccountsForUser(effectiveUserId).then(freshAccounts => {
          if (freshAccounts && freshAccounts.length > 0) {
            console.log("Direct fetch successful, updating accounts:", freshAccounts);
            setAccounts(freshAccounts as unknown as Account[]);
            
            // Calculate totals
            const assetsTotal = freshAccounts
              .filter((a: any) => ["checking", "savings", "investment", "cash"].includes(a.type))
              .reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0);
            
            const liabilitiesTotal = freshAccounts
              .filter((a: any) => ["credit"].includes(a.type))
              .reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0);
            
            setAssets(assetsTotal);
            setLiabilities(liabilitiesTotal);
            setNetWorth(assetsTotal - liabilitiesTotal);
          }
        });
      }
    }
    
    // Force a refresh when the component mounts
    refreshData();
    
  }, [pathname]);

  useEffect(() => {
    async function fetchData() {
      console.log("Fetching accounts data, refreshKey:", refreshKey);
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
        if (settingsData?.default_currency) {
          setCurrency(settingsData.default_currency as CurrencyCode);
        }
        
        // Fetch accounts from the database
        console.log("Fetching accounts for user ID:", effectiveUser.id);
        
        const { data: accountsData, error } = await supabaseClient
          .from("accounts")
          .select("*")
          .eq("user_id", effectiveUser.id)
          .order("name");
        
        if (error) {
          console.error("Error fetching accounts:", error);
          return;
        }
        
        console.log(`Fetched ${accountsData?.length || 0} accounts for user ${effectiveUser.id}:`, accountsData);
        
        // If no accounts exist, create default accounts
        if (!accountsData || accountsData.length === 0) {
          console.log("No accounts found, creating default accounts");
          await createDefaultAccounts(effectiveUser.id);
          // Fetch accounts again after creating defaults
          const { data: updatedAccountsData } = await supabaseClient
            .from("accounts")
            .select("*")
            .eq("user_id", effectiveUser.id)
            .order("name");
          setAccounts(updatedAccountsData ? [...(updatedAccountsData as unknown as Account[])] : []);
        } else {
          setAccounts(accountsData ? [...(accountsData as unknown as Account[])] : []);
        }
        
        // Calculate total assets and liabilities
        const assetsTotal = accountsData
          ? accountsData
              .filter((a: any) => ["checking", "savings", "investment", "cash"].includes(a.type))
              .reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0)
          : 0;
        
        const liabilitiesTotal = accountsData
          ? accountsData
              .filter((a: any) => ["credit"].includes(a.type))
              .reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0)
          : 0;
        
        setAssets(assetsTotal);
        setLiabilities(liabilitiesTotal);
        setNetWorth(assetsTotal - liabilitiesTotal);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router, refreshKey]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || 'en-US', {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading accounts...</p>
        </div>
      </DashboardWrapper>
    );
  }

  if (accounts.length === 0) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Accounts</h1>
              <p className="text-muted-foreground">
                Manage your financial accounts and track balances
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/dashboard/accounts/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </header>

          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold mb-2">No Accounts Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't added any accounts yet. Add your first account to start tracking your finances.
              </p>
              <Link href="/dashboard/accounts/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Accounts</h1>
          <Button onClick={() => router.push('/dashboard/accounts/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
        
        <div className="flex flex-col gap-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Assets
                </div>
                <div className="text-2xl font-bold mt-2 text-green-600">
                  {formatCurrency(assets)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Across{" "}
                  {
                    accounts.filter((a) =>
                      ["checking", "savings", "investment", "cash"].includes(
                        a.type,
                      ),
                    ).length
                  }{" "}
                  accounts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Liabilities
                </div>
                <div className="text-2xl font-bold mt-2 text-red-600">
                  {formatCurrency(liabilities)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Across{" "}
                  {accounts.filter((a) => ["credit"].includes(a.type)).length}{" "}
                  accounts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Net Worth
                </div>
                <div
                  className={`text-2xl font-bold mt-2 ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(netWorth)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assets minus Liabilities
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search accounts..." className="pl-10" />
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accounts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Link key={account.id} href={`/dashboard/accounts/${account.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{account.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {account.type}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div
                        className={`text-xl font-bold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      {account.institution && (
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {account.institution}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}
