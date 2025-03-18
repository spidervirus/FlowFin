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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import RecurringTransactions from "@/components/transaction-components/recurring-transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardWrapper from "../dashboard-wrapper";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";

// Define a minimal user type for our purposes
interface MinimalUser {
  id: string;
  email?: string;
}

// Define transaction type
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  is_recurring: boolean;
  recurrence_frequency?: string;
  next_occurrence_date?: string;
  category?: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to force refresh data
  const refreshData = () => {
    console.log("Forcing data refresh");
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Function to directly fetch transactions data for a user
  const fetchTransactionsForUser = async (userId: string) => {
    console.log("Directly fetching transactions for user:", userId);
    try {
      const supabaseClient = createSupabaseClient();
      const { data, error } = await supabaseClient
        .from("transactions")
        .select("*, category:category_id(id, name, type, color)")
        .eq("user_id", userId)
        .order("date", { ascending: false });
        
      if (error) {
        console.error("Error in direct fetch:", error);
        return [];
      }
      
      console.log(`Direct fetch returned ${data?.length || 0} transactions:`, data);
      return data || [];
    } catch (err) {
      console.error("Exception in direct fetch:", err);
      return [];
    }
  };

  // Force a refresh when the component mounts or when returning to this page
  useEffect(() => {
    console.log("Transactions page mounted or pathname changed");
    
    // Check if we need to refresh based on localStorage flag
    const needsRefresh = localStorage.getItem("transactionsNeedRefresh") === "true";
    if (needsRefresh) {
      console.log("Found transactionsNeedRefresh flag, clearing and refreshing");
      // Clear the flag
      localStorage.removeItem("transactionsNeedRefresh");
      
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
        // Do a direct fetch and update the transactions
        fetchTransactionsForUser(effectiveUserId).then(freshTransactions => {
          if (freshTransactions && freshTransactions.length > 0) {
            console.log("Direct fetch successful, updating transactions:", freshTransactions);
            setTransactions(freshTransactions as unknown as Transaction[]);
          }
        });
      }
    }
    
    // Force a refresh when the component mounts
    refreshData();
    
  }, [pathname]);

  useEffect(() => {
    async function fetchData() {
      console.log("Fetching transactions data, refreshKey:", refreshKey);
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
        console.log("Set user to:", effectiveUser);
        
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
        
        // Fetch transactions from the database
        console.log("Fetching transactions for user ID:", effectiveUser.id);
        
        // Use a direct query with no caching to ensure fresh data
        const { data: transactionsData, error } = await supabaseClient
          .from("transactions")
          .select("*, category:category_id(id, name, type, color)")
          .eq("user_id", effectiveUser.id)
          .order("date", { ascending: false });
        
        if (error) {
          console.error("Error fetching transactions:", error);
          return;
        }
        
        console.log(`Fetched ${transactionsData?.length || 0} transactions for user ${effectiveUser.id}:`, transactionsData);
        
        // Force a re-render by creating a new array and cast to Transaction type
        if (transactionsData && transactionsData.length > 0) {
          console.log("Setting transactions state with data:", transactionsData);
          setTransactions(transactionsData as unknown as Transaction[]);
        } else {
          console.log("No transactions found, setting empty array");
          setTransactions([]);
        }
        
        // Fetch recurring transactions
        const { data: recurringData, error: recurringError } = await supabaseClient
          .from("transactions")
          .select("*, category:category_id(id, name, type, color)")
          .eq("user_id", effectiveUser.id)
          .eq("is_recurring", true)
          .order("next_occurrence_date", { ascending: true });
        
        if (recurringError) {
          console.error("Error fetching recurring transactions:", recurringError);
          return;
        }
        
        console.log(`Fetched ${recurringData?.length || 0} recurring transactions for user ${effectiveUser.id}`);
        
        // Set recurring transactions
        if (recurringData && recurringData.length > 0) {
          setRecurringTransactions(recurringData as unknown as Transaction[]);
        } else {
          setRecurringTransactions([]);
        }
        
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refreshKey, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || 'en-US', {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading transactions...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              Manage and track your financial transactions
            </p>
            {/* Debug info - remove in production */}
            <div className="text-xs text-muted-foreground mt-1">
              User ID: {user?.id || 'Not set'} | 
              Transactions: {transactions.length} | 
              <Button 
                variant="link" 
                className="text-xs p-0 h-auto" 
                onClick={refreshData}
              >
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData}>
              Refresh
            </Button>
            <Link href="/dashboard/transactions/import">
              <Button variant="outline">
                <ArrowDownLeft className="mr-2 h-4 w-4" /> Import
              </Button>
            </Link>
            <Link href="/dashboard/transactions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </Link>
          </div>
        </header>

        {/* Tabs for All Transactions and Recurring */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-8 mt-6">
            {/* Filters Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search transactions..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="payroll">Payroll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  A list of all your recent transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center max-w-md">
                      <h2 className="text-xl font-semibold mb-2">No Transactions Yet</h2>
                      <p className="text-muted-foreground mb-6">
                        You haven't added any transactions yet. Add your first transaction to start tracking your finances.
                      </p>
                      <Link href="/dashboard/transactions/new">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> Add Your First Transaction
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Description
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Category
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div
                                  className={`mr-3 p-1.5 rounded-full ${
                                    transaction.type === "income"
                                      ? "bg-green-100"
                                      : transaction.type === "expense"
                                      ? "bg-red-100"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {transaction.type === "income" ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                  ) : transaction.type === "expense" ? (
                                    <ArrowDownLeft className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                                {transaction.description}
                                {transaction.is_recurring && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    Recurring
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {transaction.category?.name || "Uncategorized"}
                            </td>
                            <td
                              className={`py-3 px-4 font-medium ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : transaction.type === "expense"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {transaction.type === "income"
                                ? "+"
                                : transaction.type === "expense"
                                ? "-"
                                : ""}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recurring" className="mt-6">
            {/* Make sure we're passing valid data to RecurringTransactions */}
            {recurringTransactions.length > 0 ? (
              <RecurringTransactions 
                transactions={recurringTransactions
                  .filter(t => t.recurrence_frequency && t.next_occurrence_date)
                  .map(t => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    recurrence_frequency: t.recurrence_frequency || 'monthly',
                    next_occurrence_date: t.next_occurrence_date || '',
                    category: {
                      name: t.category?.name || 'Uncategorized',
                      type: t.category?.type || 'expense'
                    }
                  }))} 
                currency={currency} 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recurring Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No recurring transactions found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set up recurring transactions for bills, subscriptions, or regular income.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
