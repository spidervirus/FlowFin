"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  TooltipProps,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Calendar,
  PiggyBank,
  ShoppingBag,
  Coffee,
  Utensils,
  Home,
  Car,
  CreditCard,
  Lightbulb,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types/financial";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { toast } from "sonner";
import { Database } from "@/lib/supabase/database.types";

type DbTransaction = Database["public"]["Tables"]["transactions"]["Row"];
type DbCategory = Database["public"]["Tables"]["categories"]["Row"];

type Transaction = DbTransaction & {
  category?: DbCategory;
};

interface SpendingInsight {
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral" | "suggestion" | "warning" | "info";
  icon: JSX.Element;
  value?: string;
  change?: number;
}

interface CategorySpending {
  category: DbCategory;
  amount: number;
  percentage: number;
}

interface MonthlySpending {
  month: string;
  amount: number;
}

interface CompanySettings {
  id: string;
  user_id: string;
  company_name?: string;
  default_currency: CurrencyCode;
  country?: string;
  fiscal_year_start?: string;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

interface SpendingInsightsProps {
  currency: CurrencyCode;
}

export default function SpendingInsights({ currency }: SpendingInsightsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);
  const [savingSuggestions, setSavingSuggestions] = useState<SpendingInsight[]>([]);
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y">("1M");
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      analyzeSpendingPatterns(transactions);
    }
  }, [transactions, categories, timeframe]);

  const fetchData = async () => {
    try {
      const supabase = createClient();

      // Get user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast.error("Please sign in to view spending insights");
        return;
      }

      // Fetch company settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError) {
        console.error("Error fetching company settings:", settingsError);
        toast.error("Failed to load company settings");
        return;
      }

      if (settingsData) {
        const companySettings: CompanySettings = {
          id: settingsData.id,
          user_id: settingsData.user_id,
          company_name: settingsData.company_name || undefined,
          default_currency: settingsData.default_currency as CurrencyCode,
          country: (settingsData as any).country || undefined,
          fiscal_year_start: settingsData.fiscal_year_start || undefined,
          created_at: settingsData.created_at,
          updated_at: settingsData.updated_at,
        };
        setSettings(companySettings);
      }

      // Get date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case "1M":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6M":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1Y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch transactions with categories
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (transactionsError) {
        toast.error("Failed to fetch transactions");
        return;
      }

      if (transactionsData) {
        const transformedTransactions: Transaction[] = transactionsData.map((t) => ({
          ...t,
          category: t.category || undefined,
        }));
        setTransactions(transformedTransactions);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense");

      if (categoriesError) {
        toast.error("Failed to fetch categories");
        return;
      }

      if (categoriesData) {
        setCategories(categoriesData);
      }

      toast.success("Data loaded successfully");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("An error occurred while fetching data");
    }
  };

  const analyzeSpendingPatterns = (transactions: Transaction[]) => {
    // Filter expense transactions
    const expenses = transactions.filter((t) => t.type === "expense");

    if (expenses.length === 0) {
      setInsights([
        {
          title: "Not enough data",
          description: "We need more transaction data to generate insights.",
          type: "neutral",
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
        },
      ]);
      return;
    }

    // Calculate total spending
    const totalSpending = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Calculate average daily spending
    const dateRange = getDateRange(expenses);
    const days = Math.max(1, dateRange);
    const averageDailySpending = totalSpending / days;

    // Group spending by category
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach((t) => {
      if (t.category) {
        const categoryName = t.category.name;
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount;
      }
    });

    // Calculate category spending percentages
    const categorySpending: CategorySpending[] = Object.entries(categoryTotals)
      .map(([name, amount]) => {
        const category = categories.find((c) => c.name === name);
        if (!category) return null;
        return {
          category,
          amount,
          percentage: (amount / totalSpending) * 100,
        };
      })
      .filter((item): item is CategorySpending => item !== null)
      .sort((a, b) => b.amount - a.amount);

    setCategorySpending(categorySpending);

    // Calculate monthly spending
    const monthlyData = calculateMonthlySpending(expenses);
    setMonthlySpending(monthlyData);

    // Generate insights
    const newInsights: SpendingInsight[] = [];

    // Top spending category
    if (categorySpending.length > 0) {
      const topCategory = categorySpending[0];
      const topCategoryPercentage = Math.round(
        (topCategory.amount / totalSpending) * 100,
      );

      newInsights.push({
        title: "Top Spending Category",
        description: `${topCategory.category.name} accounts for ${topCategoryPercentage}% of your expenses.`,
        type: "neutral",
        icon: <ShoppingBag className="h-5 w-5 text-blue-500" />,
        value: formatCurrency(topCategory.amount),
      });
    }

    // Monthly trend
    if (monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];

      const monthlyChange =
        ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) *
        100;

      newInsights.push({
        title: "Monthly Spending Trend",
        description:
          monthlyChange > 0
            ? `Your spending increased by ${Math.abs(monthlyChange).toFixed(1)}% compared to last month.`
            : `Your spending decreased by ${Math.abs(monthlyChange).toFixed(1)}% compared to last month.`,
        type: monthlyChange > 0 ? "negative" : "positive",
        icon:
          monthlyChange > 0 ? (
            <TrendingUp className="h-5 w-5 text-red-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-green-500" />
          ),
        change: monthlyChange,
      });
    }

    // Daily average
    newInsights.push({
      title: "Daily Average",
      description: `You spend an average of ${formatCurrency(averageDailySpending)} per day.`,
      type: "neutral",
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      value: formatCurrency(averageDailySpending),
    });

    // Unusual spending
    const unusualSpending = findUnusualSpending(expenses);
    if (unusualSpending) {
      newInsights.push(unusualSpending);
    }

    setInsights(newInsights);

    // Generate saving suggestions
    generateSavingSuggestions(expenses, categorySpending);
  };

  const getDateRange = (transactions: Transaction[]): number => {
    const endDate = new Date();
    const startDate = new Date();

    transactions.forEach((t) => {
      const transactionDate = new Date(t.date);
      if (transactionDate < startDate) {
        startDate.setTime(transactionDate.getTime());
      }
      if (transactionDate > endDate) {
        endDate.setTime(transactionDate.getTime());
      }
    });

    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days;
  };

  const calculateMonthlySpending = (
    expenses: Transaction[],
  ): MonthlySpending[] => {
    const monthlyMap = new Map<string, number>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;

      monthlyMap.set(
        monthYear,
        (monthlyMap.get(monthYear) || 0) + expense.amount,
      );
    });

    // Convert to array and sort by date
    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");

        if (aYear !== bYear) {
          return parseInt(aYear) - parseInt(bYear);
        }

        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
  };

  const findUnusualSpending = (
    expenses: Transaction[],
  ): SpendingInsight | null => {
    // Group by category
    const categoryAmounts = new Map<string, number[]>();

    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || "Uncategorized";

      if (!categoryAmounts.has(categoryName)) {
        categoryAmounts.set(categoryName, []);
      }

      categoryAmounts.get(categoryName)?.push(expense.amount);
    });

    let mostUnusualInsight: SpendingInsight | null = null;

    categoryAmounts.forEach((amounts, category) => {
      // Need at least 3 data points to calculate quartiles meaningfully
      if (amounts.length < 3) return;

      // Sort amounts to find quartiles
      const sortedAmounts = [...amounts].sort((a, b) => a - b);
      const q1 = sortedAmounts[Math.floor((sortedAmounts.length - 1) * 0.25)];
      const q3 = sortedAmounts[Math.floor((sortedAmounts.length - 1) * 0.75)];
      const iqr = q3 - q1;

      // Define outlier boundaries
      const upperBoundary = q3 + 1.5 * iqr;

      // Find highest outlier in this category
      const highestOutlier = sortedAmounts.findLast(amount => amount > upperBoundary);

      if (highestOutlier !== undefined) {
        // Calculate how far above the upper boundary this outlier is (as a percentage of IQR)
        const distanceAboveBoundary = highestOutlier - upperBoundary;
        // Use a metric to compare unusualness across categories, e.g., percentage above median or Q3
        const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
        const percentageAboveMedian = ((highestOutlier - median) / median) * 100;

        const currentInsight: SpendingInsight = {
          title: "Unusual Spending Detected",
          description: `Your ${category} expense of ${formatCurrency(highestOutlier)} is significantly higher than typical spending in this category.`, // Simplified description
          type: "negative",
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
          value: formatCurrency(highestOutlier),
          change: percentageAboveMedian, // Using percentage above median as a measure of unusualness
        };

        // Keep track of the most unusual insight (e.g., highest percentage above median)
        if (!mostUnusualInsight || (currentInsight.change && mostUnusualInsight.change && currentInsight.change > mostUnusualInsight.change)) {
          mostUnusualInsight = currentInsight;
        }
      }
    });

    return mostUnusualInsight;
  };

  const generateSavingSuggestions = (
    expenses: Transaction[],
    categorySpending: CategorySpending[],
  ) => {
    const suggestions: SpendingInsight[] = [];

    // Generate suggestions for top spending categories
    const topCategoriesToSuggest = categorySpending.slice(0, 3); // Suggest for the top 3 categories

    topCategoriesToSuggest.forEach(category => {
      const potentialSavingsAmount = Math.round(category.amount * 0.05); // Suggest a 5% reduction as a starting point

      if (potentialSavingsAmount > 0) {
        suggestions.push({
          title: `Consider Reducing ${category.category.name} Spending`,
          description: `Your highest spending category is ${category.category.name}. Reducing these expenses by just 5% could save you around ${formatCurrency(potentialSavingsAmount)} ${timeframe === '1M' ? 'this month' : `over the last ${timeframe}`}.`,
          type: "suggestion",
          icon: <PiggyBank className="h-5 w-5 text-green-500" />,
          value: formatCurrency(potentialSavingsAmount),
        });
      }
    });

    // Keep the subscription review suggestion if relevant data exists
    const subscriptionKeywords = [
      "subscription",
      "netflix",
      "spotify",
      "hulu",
      "disney",
      "apple",
      "amazon prime",
      "membership",
    ];
    const subscriptionExpenses = expenses.filter((e) => {
      const description = e.description?.toLowerCase() || "";
      return subscriptionKeywords.some((keyword) =>
        description.includes(keyword),
      );
    });

    if (subscriptionExpenses.length > 0) {
      const subscriptionTotal = subscriptionExpenses.reduce(
        (sum, e) => sum + e.amount,
        0,
      );

      suggestions.push({
        title: "Review Subscriptions",
        description: `You've spent ${formatCurrency(subscriptionTotal)} on subscriptions ${timeframe === '1M' ? 'this month' : `over the last ${timeframe}`}. Consider reviewing which ones you actually use regularly.`,
        type: "suggestion",
        icon: <CreditCard className="h-5 w-5 text-green-500" />,
        value: formatCurrency(subscriptionTotal),
      });
    }

    // Add a general tip
    suggestions.push({
      title: "Track Your Spending",
      description:
        "Regularly tracking your expenses is the first step to understanding and controlling your spending habits.",
      type: "suggestion",
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
    });

    setSavingSuggestions(suggestions);
  };

  const formatCurrency = (amount: number) => {
    const currencyCode = settings?.default_currency || currency;
    return new Intl.NumberFormat(
      CURRENCY_CONFIG[currencyCode]?.locale || "en-US",
      {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits:
          CURRENCY_CONFIG[currencyCode]?.minimumFractionDigits ?? 2,
        maximumFractionDigits: 2,
      },
    ).format(amount);
  };

  const handleTimeframeChange = (newTimeframe: "1M" | "3M" | "6M" | "1Y") => {
    setTimeframe(newTimeframe);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Spending Insights</CardTitle>
            <CardDescription>
              {settings?.company_name ? `${settings.company_name} - ` : ""}
              AI-powered analysis of your spending patterns
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Time Period</h3>
              <div className="flex space-x-2">
                <Button
                  variant={timeframe === "1M" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeframeChange("1M")}
                >
                  1 Month
                </Button>
                <Button
                  variant={timeframe === "3M" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeframeChange("3M")}
                >
                  3 Months
                </Button>
                <Button
                  variant={timeframe === "6M" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeframeChange("6M")}
                >
                  6 Months
                </Button>
                <Button
                  variant={timeframe === "1Y" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeframeChange("1Y")}
                >
                  1 Year
                </Button>
              </div>
            </div>

            <Tabs defaultValue="insights">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="insights">Key Insights</TabsTrigger>
                <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
                <TabsTrigger value="suggestions">
                  Saving Suggestions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4 pt-4">
                {insights.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No insights available
                    </h3>
                    <p className="text-muted-foreground">
                      We need more transaction data to generate insights.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-2">
                            <div
                              className={`p-2 rounded-full ${
                                insight.type === "positive"
                                  ? "bg-green-100"
                                  : insight.type === "negative"
                                    ? "bg-red-100"
                                    : insight.type === "suggestion"
                                      ? "bg-blue-100"
                                      : "bg-gray-100"
                              }`}
                            >
                              {insight.icon}
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {insight.title}
                              </CardTitle>
                              {insight.value && (
                                <div className="text-2xl font-bold mt-1">
                                  {insight.value}
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <p className="text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                            {insight.change !== undefined && (
                              <Badge
                                className={
                                  insight.change > 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {insight.change > 0 ? "+" : ""}
                                {insight.change.toFixed(1)}%
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {monthlySpending.length > 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Monthly Spending Trend
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={monthlySpending}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip
                                  formatter={(value: number) => [
                                    `${formatCurrency(value)}`,
                                    "Amount",
                                  ]}
                                />
                                <Bar dataKey="amount" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="categories" className="pt-4">
                {categorySpending.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No category data available
                    </h3>
                    <p className="text-muted-foreground">
                      We need more transaction data to show category breakdown.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Spending by Category
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categorySpending}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                                nameKey="category.name"
                                label={({
                                  name,
                                  percent,
                                }: {
                                  name: string;
                                  percent: number;
                                }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {categorySpending.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      entry.category.color ||
                                      COLORS[index % COLORS.length]
                                    }
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) =>
                                  formatCurrency(value)
                                }
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Top Spending Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {categorySpending
                            .slice(0, 5)
                            .map((category, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor:
                                        category.category.color ||
                                        COLORS[index % COLORS.length],
                                    }}
                                  ></div>
                                  <span>{category.category.name}</span>
                                </div>
                                <span className="font-medium">
                                  {formatCurrency(category.amount)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4 pt-4">
                {savingSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No suggestions available
                    </h3>
                    <p className="text-muted-foreground">
                      We need more transaction data to generate saving
                      suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savingSuggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        className="overflow-hidden border-l-4 border-l-green-500"
                      >
                        <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-2">
                          <div className="p-2 rounded-full bg-green-100">
                            {suggestion.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {suggestion.title}
                            </CardTitle>
                            {suggestion.value && (
                              <div className="text-lg font-bold mt-1 text-green-600">
                                Potential Savings: {suggestion.value}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-sm text-muted-foreground">
                            {suggestion.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                    <Alert className="bg-blue-50 border-blue-200">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Pro Tip</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Setting up automatic transfers to a savings account on
                        payday can help you save before you have a chance to
                        spend.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          These insights are generated based on your transaction history and are
          meant to help you understand your spending patterns. For professional
          financial advice, please consult a financial advisor.
        </p>
      </CardFooter>
    </Card>
  );
}
