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
  Calendar,
  Wallet,
  Tag,
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

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category_id: string | null;
  account_id: string;
  date: string;
  notes: string | null;
  status: "pending" | "completed" | "reconciled";
  is_recurring: boolean | null;
  recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  next_occurrence_date: string | null;
  category: {
    name: string;
    type: "income" | "expense" | "transfer";
  } | null;
  account: {
    name: string;
    type: string;
    currency: string;
    code?: string | null;
  } | null;
}

interface CompanySettings {
  id: string;
  company_name: string;
  address: string;
  country?: string | null;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
  industry: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);

  const supabase = createClient();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view transactions");
        return;
      }

      // Fetch company settings
      const { data: settings, error: settingsError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError) {
        toast.error("Error fetching company settings");
        return;
      }

      if (settings) {
        setCompanySettings(settings as CompanySettings);
        if (settings.default_currency) {
          setCurrency(settings.default_currency as CurrencyCode);
        }
      }

      // Fetch transactions with related data
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select(
            `
          *,
          category:categories(name, type),
          account:chart_of_accounts(name, type, currency, code)
        `
          )
          .eq("user_id", user.id)
          .order("date", { ascending: false });

      if (transactionsError) {
        console.error("Error fetching transactions:", JSON.stringify(transactionsError, null, 2));
        toast.error("Error fetching transactions: " + transactionsError.message);
        return;
      }

      const transformedTransactions = (transactionsData || []).map(tx => {
        const accountData = tx.account ? {
          name: tx.account.name,
          type: tx.account.type as string,
          currency: tx.account.currency as string,
          code: tx.account.code || null,
        } : null;

        const categoryData = tx.category ? {
          name: tx.category.name,
          type: tx.category.type as "income" | "expense" | "transfer",
        } : null;

        return {
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type as Transaction["type"],
          category_id: tx.category_id || null,
          account_id: tx.account_id,
          date: tx.date,
          notes: tx.notes || null,
          status: tx.status as Transaction["status"],
          is_recurring: tx.is_recurring === undefined ? null : tx.is_recurring,
          recurrence_frequency: (tx as any).recurrence_frequency as Transaction["recurrence_frequency"] || null,
          next_occurrence_date: (tx as any).next_occurrence_date as string || null,
          category: categoryData,
          account: accountData,
        };
      });

      setTransactions(transformedTransactions as Transaction[]);
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const transactionsSubscription = supabase
      .channel("transactions_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
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
      transactionsSubscription.unsubscribe();
      settingsSubscription.unsubscribe();
    };
  }, []);

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      setDeletingTransactionId(transactionId);
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;
      toast.success("Transaction deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Error deleting transaction");
    } finally {
      setDeletingTransactionId(null);
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

  const getTransactionTypeColor = (type: Transaction["type"]) => {
    switch (type) {
      case "income":
        return "text-green-500";
      case "expense":
        return "text-red-500";
      case "transfer":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const calculateTotal = (type: "income" | "expense") => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalIncome = calculateTotal("income");
  const totalExpense = calculateTotal("expense");
  const netAmount = totalIncome - totalExpense;

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
              <h2 className="text-3xl font-bold tracking-tight">
                Transactions
              </h2>
              <p className="text-muted-foreground">
                View and manage your financial transactions
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
              <Link href="/dashboard/transactions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalExpense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
              <ArrowUpRight
                className={`h-4 w-4 ${netAmount >= 0 ? "text-green-500" : "text-red-500"}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {formatCurrency(netAmount)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
            <TabsTrigger value="transfer">Transfers</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : transaction.type === "expense" ? "bg-red-100" : "bg-blue-100"}`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : transaction.type === "expense" ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {transaction.description}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {transaction.account?.name || "Unknown Account"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {transaction.category?.name || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}
                      >
                        {formatCurrency(transaction.amount)}
                      </div>
                      <Link
                        href={`/dashboard/transactions/${transaction.id}/edit`}
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
                            <AlertDialogTitle>
                              Delete Transaction
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              className="bg-red-500 hover:bg-red-600"
                              disabled={
                                deletingTransactionId === transaction.id
                              }
                            >
                              {deletingTransactionId === transaction.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {transaction.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {transaction.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="income" className="space-y-4">
            <div className="grid gap-4">
              {transactions
                .filter((t) => t.type === "income")
                .map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {transaction.description}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Wallet className="h-3 w-3" />
                              {transaction.account?.name || "Unknown Account"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {transaction.category?.name || "Uncategorized"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}
                        >
                          {formatCurrency(transaction.amount)}
                        </div>
                        <Link
                          href={`/dashboard/transactions/${transaction.id}/edit`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
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
                              <AlertDialogTitle>
                                Delete Transaction
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this
                                transaction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteTransaction(transaction.id)
                                }
                                className="bg-red-500 hover:bg-red-600"
                                disabled={
                                  deletingTransactionId === transaction.id
                                }
                              >
                                {deletingTransactionId === transaction.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    {transaction.notes && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          {transaction.notes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="expense" className="space-y-4">
            <div className="grid gap-4">
              {transactions
                .filter((t) => t.type === "expense")
                .map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {transaction.description}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Wallet className="h-3 w-3" />
                              {transaction.account?.name || "Unknown Account"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {transaction.category?.name || "Uncategorized"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}
                        >
                          {formatCurrency(transaction.amount)}
                        </div>
                        <Link
                          href={`/dashboard/transactions/${transaction.id}/edit`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
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
                              <AlertDialogTitle>
                                Delete Transaction
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this
                                transaction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteTransaction(transaction.id)
                                }
                                className="bg-red-500 hover:bg-red-600"
                                disabled={
                                  deletingTransactionId === transaction.id
                                }
                              >
                                {deletingTransactionId === transaction.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    {transaction.notes && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          {transaction.notes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="transfer" className="space-y-4">
            <div className="grid gap-4">
              {transactions
                .filter((t) => t.type === "transfer")
                .map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-blue-100">
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {transaction.description}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Wallet className="h-3 w-3" />
                              {transaction.account?.name || "Unknown Account"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {transaction.category?.name || "Uncategorized"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-blue-500">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <Link
                          href={`/dashboard/transactions/${transaction.id}/edit`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
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
                              <AlertDialogTitle>
                                Delete Transaction
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this
                                transaction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteTransaction(transaction.id)
                                }
                                className="bg-red-500 hover:bg-red-600"
                                disabled={
                                  deletingTransactionId === transaction.id
                                }
                              >
                                {deletingTransactionId === transaction.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    {transaction.notes && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          {transaction.notes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {transactions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold mb-2">
                  No Transactions Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Add your first transaction to start tracking your finances.
                </p>
                <Link href="/dashboard/transactions/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Transaction
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
