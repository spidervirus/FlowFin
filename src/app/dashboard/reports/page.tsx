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
import { BarChart3, Download, FileText, PieChart, ClipboardList } from "lucide-react";
import DashboardWrapper from "../dashboard-wrapper";
import { createClient } from '@/lib/supabase/client';
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category_id: string;
  category_name?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface CompanySettings {
  company_name: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportType, setReportType] = useState("profit-loss");
  const [dateRange, setDateRange] = useState("this-year");
  const [comparison, setComparison] = useState("previous-period");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    revenueByCategory: {} as Record<string, number>,
    expensesByCategory: {} as Record<string, number>,
    monthlyData: [] as { month: string; revenue: number; expenses: number }[],
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const supabaseClient = createClient();
        
        // Check if user is authenticated
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push('/sign-in');
          return;
        }

        // Fetch company settings
        const { data: settingsData, error: settingsError } = await supabaseClient
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          console.error('Error fetching company settings:', settingsError);
          toast.error('Failed to load company settings');
          return;
        }

        setSettings(settingsData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabaseClient
          .from('categories')
          .select('id, name, type')
          .eq('user_id', user.id);

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          toast.error('Failed to load categories');
          return;
        }

        setCategories(categoriesData);

        // Create a map of category IDs to names
        const categoryMap = categoriesData.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabaseClient
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          toast.error('Failed to load transactions');
          return;
        }

        // Add category names to transactions
        const enrichedTransactions = transactionsData.map(transaction => ({
          ...transaction,
          category_name: categoryMap[transaction.category_id] || 'Uncategorized'
        }));

        setTransactions(enrichedTransactions);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('An error occurred while loading the data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    const currency = settings?.default_currency || 'USD';
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || 'en-US', {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDateRange = () => {
    const now = new Date();
    const fiscalYearStart = parseInt(settings?.fiscal_year_start || '1');
    let startDate = new Date();
    let endDate = new Date();

    switch (dateRange) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'this-year':
        const currentYear = now.getFullYear();
        const fiscalYear = now.getMonth() + 1 < fiscalYearStart ? currentYear - 1 : currentYear;
        startDate = new Date(fiscalYear, fiscalYearStart - 1, 1);
        endDate = new Date(fiscalYear + 1, fiscalYearStart - 1, 0);
        break;
      case 'last-year':
        const lastYear = now.getFullYear() - 1;
        startDate = new Date(lastYear, fiscalYearStart - 1, 1);
        endDate = new Date(lastYear + 1, fiscalYearStart - 1, 0);
        break;
    }

    return { startDate, endDate };
  };

  const generateReport = () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      // Calculate totals
      const revenue = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      // Calculate revenue by category
      const revenueByCategory = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
          const categoryName = t.category_name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      // Calculate expenses by category
      const expensesByCategory = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const categoryName = t.category_name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      // Calculate monthly data
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const monthTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === month.getMonth() &&
                 transactionDate.getFullYear() === month.getFullYear();
        });

        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
          expenses: monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
        };
      });

      setReportData({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        profitMargin,
        revenueByCategory,
        expensesByCategory,
        monthlyData,
      });

      setReportGenerated(true);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    generateReport();
  };

  return (
    <DashboardWrapper>
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">
              {settings?.company_name ? `${settings.company_name} - ` : ''}Generate and analyze your business financial reports
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              disabled={!reportGenerated}
              onClick={() => alert("Export functionality would be implemented here")}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button 
              variant="outline" 
              disabled={!reportGenerated}
              onClick={() => alert("Print functionality would be implemented here")}
            >
              <FileText className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </header>

        {/* Report Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select 
                  value={reportType}
                  onValueChange={(value) => setReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Report" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                    <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                    <SelectItem value="cash-flow">Cash Flow</SelectItem>
                    <SelectItem value="tax-summary">Tax Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select 
                  value={dateRange}
                  onValueChange={(value) => setDateRange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Comparison</label>
                <Select 
                  value={comparison}
                  onValueChange={(value) => setComparison(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Comparison" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="previous-period">Previous Period</SelectItem>
                    <SelectItem value="previous-year">Previous Year</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="mt-auto" 
                onClick={handleGenerateReport}
                disabled={isLoading}
              >
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State - Shown before generating a report */}
        {!reportGenerated && (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <h2 className="text-xl font-semibold mb-2">No Reports Generated Yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Select your report parameters above and click "Generate Report" to view your financial data.
            </p>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </Card>
        )}

        {/* Report Tabs - These will be shown only after generating a report */}
        {reportGenerated && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Revenue",
                    value: formatCurrency(reportData.totalRevenue),
                    change: "0%",
                    changeType: "neutral",
                  },
                  {
                    title: "Total Expenses",
                    value: formatCurrency(reportData.totalExpenses),
                    change: "0%",
                    changeType: "neutral",
                  },
                  {
                    title: "Net Profit",
                    value: formatCurrency(reportData.netProfit),
                    change: "0%",
                    changeType: "neutral",
                  },
                  {
                    title: "Profit Margin",
                    value: `${reportData.profitMargin.toFixed(2)}%`,
                    change: "0%",
                    changeType: "neutral",
                  },
                ].map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {metric.value}
                      </div>
                      <div
                        className={`text-sm mt-1 ${
                          metric.changeType === "positive"
                            ? "text-green-600"
                            : metric.changeType === "negative"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {metric.change} from previous period
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                  <CardDescription>
                    Breakdown of revenue sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(reportData.revenueByCategory).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span>{category}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                  <CardDescription>
                    Breakdown of expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(reportData.expensesByCategory).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span>{category}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                    <CardDescription>
                      Distribution of revenue across different categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {/* Add chart component here */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>
                      Distribution of expenses across different categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {/* Add chart component here */}
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Revenue vs Expenses</CardTitle>
                    <CardDescription>
                      Comparison of monthly revenue and expenses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {/* Add chart component here */}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>
                    Monthly breakdown of financial performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.monthlyData.map((month, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-medium">{month.month}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Revenue</span>
                            <p className="font-medium">{formatCurrency(month.revenue)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Expenses</span>
                            <p className="font-medium">{formatCurrency(month.expenses)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardWrapper>
  );
}
