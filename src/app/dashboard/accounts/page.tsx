"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardWrapper from "../dashboard-wrapper";
import { CompanySettings } from "@/types/financial";
import type { Database } from "@/types/supabase";

interface PageAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: CurrencyCode;
  is_active: boolean;
  institution?: string | null;
  account_number?: string | null;
  notes?: string | null;
  code?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AccountsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<PageAccount[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
    null,
  );

  const supabase = createClient();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view accounts");
        return;
      }

      // Fetch company settings
      const { data: settings, error: settingsError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError) {
        if (settingsError.code !== 'PGRST116') {
          toast.error("Error fetching company settings: " + settingsError.message);
        }
      }

      if (settings) {
        // Construct transformedSettings strictly based on the known CompanySettings type
        const transformedSettings: CompanySettings = {
          id: settings.id, 
          user_id: settings.user_id,
          company_name: settings.company_name ?? undefined,
          default_currency: (settings.default_currency && ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"].includes(settings.default_currency.toUpperCase())) 
                            ? settings.default_currency.toUpperCase() as CurrencyCode 
                            : "USD" as CurrencyCode, // Fallback to USD if invalid or null
          country: (settings as any).country ?? undefined, // Accessing potentially untyped 'country' from settings
          fiscal_year_start: settings.fiscal_year_start ?? undefined,
          created_at: settings.created_at ?? '', 
          updated_at: settings.updated_at ?? '', 
          // Removed fields not present in the CompanySettings type (address, company_size, etc.)
        };
        setCompanySettings(transformedSettings);
        if (transformedSettings.default_currency) {
          setCurrency(transformedSettings.default_currency); // default_currency is already CurrencyCode here
        }
      } else {
        setCurrency("USD");
      }

      // Fetch accounts from chart_of_accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (accountsError) {
        toast.error("Error fetching accounts: " + accountsError.message);
        return;
      }

      // Transform the data to match Account type
      const transformedAccounts: PageAccount[] = (accountsData || []).map((account: any) => ({
        ...account,
        balance: account.balance === null || account.balance === undefined ? 0 : Number(account.balance),
        currency: account.currency as CurrencyCode,
      }));

      setAccounts(transformedAccounts);
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Error fetching data: " + error.message);
      } else {
        toast.error("An unknown error occurred while fetching data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const accountsSubscription = supabase
      .channel("accounts_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    const settingsSubscription = supabase
      .channel("settings_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_settings",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      accountsSubscription.unsubscribe();
      settingsSubscription.unsubscribe();
    };
  }, []);

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setDeletingAccountId(accountId);
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
      toast.success("Account deleted successfully");
      fetchData();
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Error deleting account: " + error.message);
      } else {
        toast.error("An unknown error occurred while deleting the account.");
      }
    } finally {
      setDeletingAccountId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "checking":
      case "savings":
      case "cash":
      case "asset":
        return "text-green-500";
      case "credit":
      case "liability":
        return "text-red-500";
      case "investment":
      case "equity":
        return "text-blue-500";
      case "revenue":
        return "text-purple-500";
      case "expense":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  };

  const totalBalance = calculateTotalBalance();

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
              <p className="text-muted-foreground">
                Manage your financial accounts and balances
              </p>
            </div>
            <div className="flex items-center gap-4">
              {companySettings && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="text-lg font-semibold">
                    {companySettings.company_name}
                  </p>
                </div>
              )}
              <Link href="/dashboard/accounts/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalBalance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Number of Accounts
              </CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Accounts</TabsTrigger>
            <TabsTrigger value="asset_liability">Assets & Liabilities</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="revenue_expense">Revenue & Expenses</TabsTrigger>
            <TabsTrigger value="bank_cash">Bank & Cash</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100`}>
                        <Wallet
                          className={`h-4 w-4 ${getAccountTypeColor(account.type)}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {account.name} ({account.code || 'N/A'})
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          Type: {account.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium ${getAccountTypeColor(account.type)}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      <Link
                        href={`/dashboard/chart-of-accounts/${account.id}/edit`}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-500 hover:bg-red-600"
                              disabled={deletingAccountId === account.id}
                            >
                              {deletingAccountId === account.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {account.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {account.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="asset_liability" className="space-y-4">
            {accounts
              .filter((a) => a.type === "asset" || a.type === "liability")
              .map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100`}>
                        <Wallet
                          className={`h-4 w-4 ${getAccountTypeColor(account.type)}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {account.name} ({account.code || 'N/A'})
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          Type: {account.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium ${getAccountTypeColor(account.type)}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      <Link
                        href={`/dashboard/chart-of-accounts/${account.id}/edit`}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-500 hover:bg-red-600"
                              disabled={deletingAccountId === account.id}
                            >
                              {deletingAccountId === account.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {account.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {account.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
          </TabsContent>
          <TabsContent value="equity" className="space-y-4">
            {accounts
              .filter((a) => a.type === "equity")
              .map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100`}>
                        <Wallet
                          className={`h-4 w-4 ${getAccountTypeColor(account.type)}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {account.name} ({account.code || 'N/A'})
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          Type: {account.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium ${getAccountTypeColor(account.type)}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      <Link
                        href={`/dashboard/chart-of-accounts/${account.id}/edit`}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-500 hover:bg-red-600"
                              disabled={deletingAccountId === account.id}
                            >
                              {deletingAccountId === account.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {account.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {account.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
          </TabsContent>
          <TabsContent value="revenue_expense" className="space-y-4">
            {accounts
              .filter((a) => a.type === "revenue" || a.type === "expense")
              .map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100`}>
                        <Wallet
                          className={`h-4 w-4 ${getAccountTypeColor(account.type)}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {account.name} ({account.code || 'N/A'})
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          Type: {account.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium ${getAccountTypeColor(account.type)}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      <Link
                        href={`/dashboard/chart-of-accounts/${account.id}/edit`}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-500 hover:bg-red-600"
                              disabled={deletingAccountId === account.id}
                            >
                              {deletingAccountId === account.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {account.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {account.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
          </TabsContent>
          <TabsContent value="bank_cash" className="space-y-4">
            {accounts
              .filter((a) => a.type === "checking" || a.type === "savings" || a.type === "cash")
              .map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100`}>
                        <Wallet
                          className={`h-4 w-4 ${getAccountTypeColor(account.type)}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {account.name} ({account.code || 'N/A'})
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          Type: {account.type} | Inst: {account.institution || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium ${getAccountTypeColor(account.type)}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      <Link
                        href={`/dashboard/chart-of-accounts/${account.id}/edit`}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-500 hover:bg-red-600"
                              disabled={deletingAccountId === account.id}
                            >
                              {deletingAccountId === account.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {account.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {account.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
          </TabsContent>
        </Tabs>

        {accounts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold mb-2">No Accounts Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your first account to start tracking your finances.
                </p>
                <Link href="/dashboard/accounts/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardWrapper>
  );
}
