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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Download,
  FileText,
  PieChart,
  ClipboardList,
} from "lucide-react";
import DashboardWrapper from "../dashboard-wrapper";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category_id: string | null;
  category_name?: string;
  account_id: string;
  status: "pending" | "completed" | "reconciled";
  notes: string | null;
  is_recurring: boolean | null;
  recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  next_occurrence_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string | null;
  default_currency: CurrencyCode;
}

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("summary");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const supabaseClient = createClient();

        // Check if user is authenticated
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch company settings
        const { data: settingsData, error: settingsError } =
          await supabaseClient
            .from("company_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
          toast.error("Failed to load company settings");
          // Set a default CompanySettings object or handle the absence of settings
          const defaultSettings: CompanySettings = {
            id: "default", // Provide appropriate default or generated ID
            user_id: user?.id || "default_user", // Use actual user ID if available
            company_name: "Default Company",
            default_currency: "USD" as CurrencyCode, // Default currency
          };
          setSettings(defaultSettings);
          setCurrency("USD" as CurrencyCode);
          // Potentially return or decide if fetching categories/transactions should proceed without settings
        } else if (settingsData) {
          // Validate and transform settings
          const isValidCurrency = settingsData.default_currency && 
                                Object.keys(CURRENCY_CONFIG).includes(settingsData.default_currency);

          const finalCurrencyCode: CurrencyCode = isValidCurrency 
            ? settingsData.default_currency as CurrencyCode 
            : "USD"; // Default to USD if invalid or missing

          const transformedSettings: CompanySettings = {
            id: settingsData.id,
            user_id: settingsData.user_id,
            company_name: settingsData.company_name ?? null,
            default_currency: finalCurrencyCode,
          };
          setSettings(transformedSettings);
          setCurrency(finalCurrencyCode);
        } else {
           // Handle case where settingsData is null but no error (e.g., new user)
           const defaultSettings: CompanySettings = {
            id: "new_user_default",
            user_id: user?.id || "default_user",
            company_name: "My Company",
            default_currency: "USD" as CurrencyCode,
          };
          setSettings(defaultSettings);
          setCurrency("USD" as CurrencyCode);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } =
          await supabaseClient
            .from("categories")
            .select("id, name, type")
            .eq("user_id", user.id);

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
          toast.error("Failed to load categories");
          return;
        }

        setCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          type: (cat.type === "income" || cat.type === "expense") ? cat.type : "expense",
        } as Category)));

        // Create a map of category IDs to names
        const categoryMap = categoriesData.reduce(
          (acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
          },
          {} as Record<string, string>,
        );

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } =
          await supabaseClient
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false });

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
          toast.error("Failed to load transactions");
          return;
        }

        // Add category names to transactions
        const transactionsWithCategories = transactionsData.map((transaction: any) => ({
          ...transaction,
          category_name: transaction.category_id ? categoryMap[transaction.category_id] : "Uncategorized",
          type: (transaction.type === "income" || transaction.type === "expense" || transaction.type === "transfer") 
                ? transaction.type as Transaction['type'] 
                : "expense",
          status: (transaction.status === "pending" || transaction.status === "completed" || transaction.status === "reconciled")
                  ? transaction.status as Transaction['status']
                  : "pending",
          recurrence_frequency: transaction.recurrence_frequency ?? null,
          next_occurrence_date: transaction.next_occurrence_date ?? null,
          is_recurring: transaction.is_recurring ?? null,
          notes: transaction.notes ?? null,
        }));

        setTransactions(transactionsWithCategories as Transaction[]);
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error("An error occurred while loading data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits:
        CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category_id === selectedCategory);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    return filtered;
  };

  const generateReport = () => {
    const filteredTransactions = filterTransactions();
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactions: filteredTransactions,
    };
  };

  const handleDownload = () => {
    const report = generateReport();
    const csv = [
      ["Date", "Description", "Category", "Type", "Amount"],
      ...report.transactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category_name || "Uncategorized",
        t.type,
        formatCurrency(t.amount),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading reports...</p>
        </div>
      </DashboardWrapper>
    );
  }

  const report = generateReport();

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
          <p className="text-muted-foreground">
            Generate and analyze your financial reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList>
            <TabsTrigger value="summary">
              <FileText className="mr-2 h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <PieChart className="mr-2 h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income">
              <BarChart3 className="mr-2 h-4 w-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <ClipboardList className="mr-2 h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.totalIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(report.totalExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Net Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-bold ${report.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(report.netIncome)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.transactions
                    .filter((t) => t.type === "expense")
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.category_name || "Uncategorized"}
                          </p>
                        </div>
                        <p className="font-medium text-red-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.transactions
                    .filter((t) => t.type === "income")
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.category_name || "Uncategorized"}
                          </p>
                        </div>
                        <p className="font-medium text-green-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.category_name || "Uncategorized"}
                        </p>
                      </div>
                      <p
                        className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
