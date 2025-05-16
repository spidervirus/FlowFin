"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Transaction, Category } from "@/types/financial";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  prediction: boolean;
}

interface CategoryForecast {
  category: string;
  categoryId: string;
  color: string;
  current: number;
  forecast: number;
  change: number;
  trend: "up" | "down" | "stable";
}

interface UpcomingExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  categoryColor: string;
  isRecurring: boolean;
}

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  start_date: string;
  frequency: string;
  type: string;
  category_id?: string;
  is_active: boolean;
  category?: {
    id: string;
    name: string;
    type: string;
    color?: string;
  };
}

interface FutureForecastingProps {
  currency: CurrencyCode;
}

export default function FutureForecasting({
  currency,
}: FutureForecastingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryForecasts, setCategoryForecasts] = useState<
    CategoryForecast[]
  >([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState<UpcomingExpense[]>(
    [],
  );
  const [forecastPeriod, setForecastPeriod] = useState<
    "3months" | "6months" | "12months"
  >("3months");
  const [userId, setUserId] = useState<string | null>(null);
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [companySettings, setCompanySettings] = useState<{
    default_currency: CurrencyCode;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      fetchForecasts();
    }
  }, [transactions, categories, forecastPeriod]);

  useEffect(() => {
    // Get user ID and company settings when component mounts
    const getUserIdAndSettings = async () => {
      const supabase = createClient();

      // Get user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch company settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
        } else if (settingsData) {
          setCompanySettings(settingsData);
        }
      }
    };
    getUserIdAndSettings();
  }, []);

  // Helper function to check if category is an object
  const isCategoryObject = (
    category: Transaction["category"],
  ): category is Category => {
    return (
      typeof category === "object" &&
      category !== null &&
      "id" in category &&
      "name" in category &&
      "type" in category
    );
  };

  // Helper function to safely extract category information
  const getCategoryInfo = (
    transaction: Transaction,
    categoriesArray: Category[],
  ): { id: string; name: string; color: string } | null => {
    try {
      if (!transaction.category) {
        return null;
      }

      if (isCategoryObject(transaction.category)) {
        // Category is already an object
        return {
          id: transaction.category.id,
          name: transaction.category.name,
          color: transaction.category.color || "#888888",
        };
      } else if (typeof transaction.category === "string") {
        // Category is a string ID, look it up in the categories array
        const categoryId = transaction.category;
        const foundCategory = categoriesArray.find((c) => c.id === categoryId);
        if (foundCategory) {
          return {
            id: foundCategory.id,
            name: foundCategory.name,
            color: foundCategory.color || "#888888",
          };
        }
      }
      
      console.warn(`Category not found for transaction: ${transaction.id}`);
      return null;
    } catch (err) {
      console.error("Error extracting category info:", err);
      return null;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch categories
      console.log("Fetching categories...");
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        throw new Error(
          `Failed to fetch categories: ${categoriesError.message}`,
        );
      }

      if (!categoriesData || categoriesData.length === 0) {
        console.warn("No active categories found");
      }

      // Fetch transactions for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split("T")[0];

      console.log("Fetching transactions since:", twelveMonthsAgoStr);

      // Fetch transactions with category join
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select(
            `
          *,
          category:categories(id, name, type, color)
        `,
          )
          .gte("date", twelveMonthsAgoStr)
          .order("date", { ascending: false });

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        throw new Error(
          `Failed to fetch transactions: ${transactionsError.message}`,
        );
      }

      // Fetch recurring transactions
      console.log("Fetching recurring transactions...");
      const { data: recurringData, error: recurringError } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("is_active", true);

      if (recurringError) {
        console.error("Error fetching recurring transactions:", recurringError);
        throw new Error(
          `Failed to fetch recurring transactions: ${recurringError.message}`,
        );
      }

      // Set all the data
      setCategories(categoriesData || []);
      setTransactions(transactionsData || []);
      setRecurringTransactions(recurringData || []);

      // If we have no transactions, show a warning to the user
      if (!transactionsData || transactionsData.length === 0) {
        setError(
          "No transaction data available for the last 12 months. Please add some transactions to see forecasts.",
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      // Set empty arrays for all data to prevent null reference errors
      setCategories([]);
      setTransactions([]);
      setRecurringTransactions([]);
      setUpcomingExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateForecasts = () => {
    try {
      console.log("Generating forecasts...");

      if (!transactions || transactions.length === 0) {
        console.warn("No transactions available for generating forecasts");
        setMonthlyData([]);
        setCategoryForecasts([]);
        return;
      }

      if (!categories || categories.length === 0) {
        console.warn("No categories available for generating forecasts");
        // We can still generate monthly data without categories
      }

      // Generate monthly historical and forecast data
      try {
        console.log("Generating monthly data...");
        const monthly = generateMonthlyData();
        setMonthlyData(monthly);
        console.log(`Generated ${monthly.length} monthly data points`);
      } catch (monthlyError) {
        console.error("Error generating monthly data:", monthlyError);
        setMonthlyData([]);
        // Continue to try category forecasts
      }

      // Generate category forecasts
      try {
        console.log("Generating category forecasts...");
        const forecasts = generateCategoryForecasts();
        setCategoryForecasts(forecasts);
        console.log(`Generated ${forecasts.length} category forecasts`);
      } catch (categoryError) {
        console.error("Error generating category forecasts:", categoryError);
        setCategoryForecasts([]);
      }
    } catch (err) {
      console.error("Error generating forecasts:", err);
      setError("Failed to generate forecasts. Please try again.");
      setMonthlyData([]);
      setCategoryForecasts([]);
    }
  };

  const generateMonthlyData = (): MonthlyData[] => {
    // Group transactions by month
    const monthlyTransactions: Record<
      string,
      { income: number; expenses: number }
    > = {};

    if (!transactions || transactions.length === 0) {
      console.warn("No transactions available for generating monthly data");
      return [];
    }

    // Count how many transactions we process successfully
    let processedCount = 0;
    let skippedCount = 0;

    transactions.forEach((transaction) => {
      try {
        if (!transaction.date) {
          console.warn("Transaction missing date:", transaction.id);
          skippedCount++;
          return;
        }

        if (
          typeof transaction.amount !== "number" &&
          isNaN(Number(transaction.amount))
        ) {
          console.warn(
            "Transaction has invalid amount:",
            transaction.id,
            transaction.amount,
          );
          skippedCount++;
          return;
        }

        const month = transaction.date.substring(0, 7); // YYYY-MM format

        if (!monthlyTransactions[month]) {
          monthlyTransactions[month] = { income: 0, expenses: 0 };
        }

        if (transaction.type === "income") {
          monthlyTransactions[month].income += Number(transaction.amount);
          processedCount++;
        } else if (transaction.type === "expense") {
          monthlyTransactions[month].expenses += Number(transaction.amount);
          processedCount++;
        } else {
          // Skip transfers or other types
          skippedCount++;
        }
      } catch (err) {
        console.error(
          "Error processing transaction for monthly data:",
          err,
          transaction,
        );
        skippedCount++;
      }
    });

    console.log(
      `Monthly data: processed ${processedCount} transactions, skipped ${skippedCount}`,
    );

    // Sort months and get the last 6
    const sortedMonths = Object.keys(monthlyTransactions).sort();

    if (sortedMonths.length === 0) {
      console.warn("No monthly data available after processing transactions");
      return [];
    }

    // We need at least 2 months of data to calculate trends
    if (sortedMonths.length < 2) {
      console.warn("Not enough monthly data to calculate trends");
      // Return what we have without forecasting
      return sortedMonths.map((month) => {
        const { income, expenses } = monthlyTransactions[month];
        const savings = income - expenses;

        // Format month for display (e.g., "Jan 2023")
        const date = new Date(month + "-01");
        const formattedMonth = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        return {
          month: formattedMonth,
          income,
          expenses,
          savings,
          prediction: false,
        };
      });
    }

    const recentMonths = sortedMonths.slice(-6);

    // Calculate average monthly change for income and expenses
    let incomeChangeSum = 0;
    let expenseChangeSum = 0;
    let changeCount = 0;

    for (let i = 1; i < recentMonths.length; i++) {
      const prevMonth = recentMonths[i - 1];
      const currMonth = recentMonths[i];

      const prevIncome = monthlyTransactions[prevMonth].income;
      const currIncome = monthlyTransactions[currMonth].income;

      const prevExpense = monthlyTransactions[prevMonth].expenses;
      const currExpense = monthlyTransactions[currMonth].expenses;

      if (prevIncome > 0) {
        incomeChangeSum += (currIncome - prevIncome) / prevIncome;
      }

      if (prevExpense > 0) {
        expenseChangeSum += (currExpense - prevExpense) / prevExpense;
      }

      changeCount++;
    }

    const avgIncomeChange = changeCount > 0 ? incomeChangeSum / changeCount : 0;
    const avgExpenseChange =
      changeCount > 0 ? expenseChangeSum / changeCount : 0;

    console.log(
      `Average monthly changes: income ${(avgIncomeChange * 100).toFixed(2)}%, expenses ${(avgExpenseChange * 100).toFixed(2)}%`,
    );

    // Create historical data
    const historicalData: MonthlyData[] = recentMonths.map((month) => {
      const { income, expenses } = monthlyTransactions[month];
      const savings = income - expenses;

      // Format month for display (e.g., "Jan 2023")
      const date = new Date(month + "-01");
      const formattedMonth = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      return {
        month: formattedMonth,
        income,
        expenses,
        savings,
        prediction: false,
      };
    });

    // Generate forecast data
    const forecastData: MonthlyData[] = [];
    const numForecastMonths = getForecastMonthsCount();

    // Only forecast if we have enough historical data
    if (historicalData.length > 0) {
      let lastIncome = historicalData[historicalData.length - 1].income;
      let lastExpenses = historicalData[historicalData.length - 1].expenses;

      for (let i = 1; i <= numForecastMonths; i++) {
        try {
          // Calculate next month date
          const lastDate = new Date(
            recentMonths[recentMonths.length - 1] + "-01",
          );
          lastDate.setMonth(lastDate.getMonth() + i);
          const nextMonth = lastDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });

          // Apply trend to forecast
          const forecastIncome = Math.round(lastIncome * (1 + avgIncomeChange));
          const forecastExpenses = Math.round(
            lastExpenses * (1 + avgExpenseChange),
          );
          const forecastSavings = forecastIncome - forecastExpenses;

          forecastData.push({
            month: nextMonth,
            income: forecastIncome,
            expenses: forecastExpenses,
            savings: forecastSavings,
            prediction: true,
          });

          // Update for next iteration
          lastIncome = forecastIncome;
          lastExpenses = forecastExpenses;
        } catch (err) {
          console.error("Error generating forecast for month:", err);
        }
      }
    }

    console.log(
      `Generated ${historicalData.length} historical data points and ${forecastData.length} forecast data points`,
    );

    return [...historicalData, ...forecastData];
  };

  const generateCategoryForecasts = (): CategoryForecast[] => {
    // Group transactions by category and month
    const categoryMonthlyData: Record<string, Record<string, number>> = {};

    if (!transactions || transactions.length === 0) {
      console.warn(
        "No transactions available for generating category forecasts",
      );
      return [];
    }

    // Count how many transactions we process successfully
    let processedCount = 0;
    let skippedCount = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        try {
          if (!transaction.date) {
            console.warn("Transaction missing date:", transaction.id);
            skippedCount++;
            return;
          }

          // Get category information using the helper function
          const categoryInfo = getCategoryInfo(transaction, categories);

          if (!categoryInfo) {
            console.warn(
              `Skipping transaction with missing or invalid category: ${transaction.id}`,
            );
            skippedCount++;
            return;
          }

          const categoryId = categoryInfo.id;

          const month = transaction.date.substring(0, 7); // YYYY-MM format

          if (!categoryMonthlyData[categoryId]) {
            categoryMonthlyData[categoryId] = {};
          }

          if (!categoryMonthlyData[categoryId][month]) {
            categoryMonthlyData[categoryId][month] = 0;
          }

          categoryMonthlyData[categoryId][month] += Number(transaction.amount);
          processedCount++;
        } catch (err) {
          console.error(
            "Error processing transaction for category forecast:",
            err,
            transaction,
          );
          skippedCount++;
          // Continue with the next transaction
        }
      }
    });

    console.log(
      `Category forecasts: processed ${processedCount} transactions, skipped ${skippedCount}`,
    );

    // Calculate trends and forecasts for each category
    const forecasts: CategoryForecast[] = [];

    Object.entries(categoryMonthlyData).forEach(([categoryId, monthlyData]) => {
      try {
        const category = categories.find((c) => c.id === categoryId);
        if (!category) {
          console.warn(`Category not found for ID: ${categoryId}`);
          return;
        }

        // Sort months
        const sortedMonths = Object.keys(monthlyData).sort();

        // Need at least 3 months of data for meaningful forecast
        if (sortedMonths.length < 3) {
          console.log(
            `Not enough monthly data for category ${category.name} (${sortedMonths.length} months)`,
          );
          return;
        }

        // Get the last 3 months of data
        const recentMonths = sortedMonths.slice(-3);
        const recentValues = recentMonths.map((month) => monthlyData[month]);

        // Calculate average monthly change
        let changeSum = 0;
        let changeCount = 0;

        for (let i = 1; i < recentValues.length; i++) {
          const prevValue = recentValues[i - 1];
          const currValue = recentValues[i];

          if (prevValue > 0) {
            changeSum += (currValue - prevValue) / prevValue;
            changeCount++;
          }
        }

        const avgChange = changeCount > 0 ? changeSum / changeCount : 0;

        // Current monthly spending (average of last 3 months)
        const currentSpending =
          recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;

        // Forecast next month
        const forecastSpending = Math.round(currentSpending * (1 + avgChange));

        // Determine trend
        let trend: "up" | "down" | "stable" = "stable";
        if (avgChange > 0.05) trend = "up";
        else if (avgChange < -0.05) trend = "down";

        forecasts.push({
          category: category.name,
          categoryId,
          color: category.color || "#888888",
          current: Math.round(currentSpending),
          forecast: forecastSpending,
          change: Math.round(avgChange * 100),
          trend,
        });
      } catch (err) {
        console.error(
          `Error processing forecast for category ID ${categoryId}:`,
          err,
        );
      }
    });

    console.log(`Generated ${forecasts.length} category forecasts`);

    // Sort by forecast amount (descending)
    return forecasts.sort((a, b) => b.forecast - a.forecast);
  };

  // New function that doesn't rely on category relationships
  const generateUpcomingExpensesWithoutCategories = (
    recurringTransactions: any[],
  ): UpcomingExpense[] => {
    if (!recurringTransactions || recurringTransactions.length === 0) {
      console.warn(
        "No recurring transactions available for generating upcoming expenses",
      );
      return [];
    }

    const upcoming: UpcomingExpense[] = [];
    const today = new Date();
    const forecastEndDate = new Date();

    // Set forecast end date based on selected period
    if (forecastPeriod === "3months") {
      forecastEndDate.setMonth(today.getMonth() + 3);
    } else if (forecastPeriod === "6months") {
      forecastEndDate.setMonth(today.getMonth() + 6);
    } else {
      forecastEndDate.setMonth(today.getMonth() + 12);
    }

    console.log(
      `Generating upcoming expenses from ${recurringTransactions.length} recurring transactions`,
    );
    console.log(
      `Forecast period: ${today.toISOString().split("T")[0]} to ${forecastEndDate.toISOString().split("T")[0]}`,
    );

    // Count how many transactions we process successfully
    let processedCount = 0;
    let skippedCount = 0;

    recurringTransactions.forEach((recurring) => {
      try {
        // Validate the recurring transaction
        if (!recurring.id) {
          console.warn("Skipping recurring transaction with missing ID");
          skippedCount++;
          return;
        }

        // Log all properties of the recurring transaction to debug
        console.log(
          `Processing recurring transaction ${recurring.id} with properties:`,
          Object.keys(recurring)
            .map((key) => `${key}: ${typeof recurring[key]}`)
            .join(", "),
        );

        // Check for required fields with flexible property names
        const startDateField =
          recurring.start_date || recurring.startDate || recurring.date;
        const frequencyField =
          recurring.frequency || recurring.recurrence_frequency;
        const typeField = recurring.type || recurring.transaction_type;
        const amountField = recurring.amount;
        const descriptionField =
          recurring.description || recurring.name || "Recurring Expense";

        if (!startDateField) {
          console.warn(
            `Skipping recurring transaction with missing start date: ${recurring.id}`,
          );
          skippedCount++;
          return;
        }

        if (!frequencyField) {
          console.warn(
            `Skipping recurring transaction with missing frequency: ${recurring.id}`,
          );
          skippedCount++;
          return;
        }

        // Only process expenses
        const isExpense = typeField === "expense" || typeField === "Expense";
        if (!isExpense) {
          console.log(
            `Skipping non-expense recurring transaction: ${recurring.id}, type: ${typeField}`,
          );
          return;
        }

        if (typeof amountField !== "number" && isNaN(Number(amountField))) {
          console.warn(
            `Skipping recurring transaction with invalid amount: ${recurring.id}, ${amountField}`,
          );
          skippedCount++;
          return;
        }

        const amount = Number(amountField);
        if (amount <= 0) {
          console.warn(
            `Skipping recurring transaction with zero or negative amount: ${recurring.id}, ${amount}`,
          );
          skippedCount++;
          return;
        }

        // Use a default category if none is available
        let categoryName = "Recurring Expense";
        let categoryColor = "#888888";

        // Try to find category information in various possible fields
        const categoryId = recurring.category_id || recurring.categoryId;
        if (categoryId && typeof categoryId === "string") {
          const foundCategory = categories.find((c) => c.id === categoryId);
          if (foundCategory) {
            categoryName = foundCategory.name;
            categoryColor = foundCategory.color || "#888888";
          }
        }

        // Parse the start date
        let startDate: Date;
        try {
          startDate = new Date(startDateField);
          if (isNaN(startDate.getTime())) {
            throw new Error("Invalid date");
          }
        } catch (err) {
          console.warn(
            `Skipping recurring transaction with invalid start date: ${recurring.id}, ${startDateField}`,
          );
          skippedCount++;
          return;
        }

        const nextDate = new Date(startDate);

        // Find the next occurrence after today
        while (nextDate < today) {
          if (frequencyField === "weekly") {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (frequencyField === "biweekly") {
            nextDate.setDate(nextDate.getDate() + 14);
          } else if (frequencyField === "monthly") {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (frequencyField === "quarterly") {
            nextDate.setMonth(nextDate.getMonth() + 3);
          } else if (frequencyField === "yearly") {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          } else {
            console.warn(
              `Skipping recurring transaction with unknown frequency: ${recurring.id}, ${frequencyField}`,
            );
            skippedCount++;
            return;
          }
        }

        // Add all occurrences within the forecast period
        let occurrenceCount = 0;
        const maxOccurrences = 50; // Safety limit to prevent infinite loops

        while (
          nextDate <= forecastEndDate &&
          occurrenceCount < maxOccurrences
        ) {
          try {
            upcoming.push({
              id: `${recurring.id}-${nextDate.toISOString()}`,
              description: descriptionField,
              amount: amount,
              date: nextDate.toISOString().split("T")[0],
              category: categoryName,
              categoryColor: categoryColor,
              isRecurring: true,
            });

            occurrenceCount++;

            // Move to next occurrence
            if (frequencyField === "weekly") {
              nextDate.setDate(nextDate.getDate() + 7);
            } else if (frequencyField === "biweekly") {
              nextDate.setDate(nextDate.getDate() + 14);
            } else if (frequencyField === "monthly") {
              nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (frequencyField === "quarterly") {
              nextDate.setMonth(nextDate.getMonth() + 3);
            } else if (frequencyField === "yearly") {
              nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else {
              break; // Unknown frequency
            }
          } catch (err) {
            console.error(
              `Error adding occurrence for recurring transaction ${recurring.id}:`,
              err,
            );
            break;
          }
        }

        if (occurrenceCount > 0) {
          processedCount++;
        } else {
          console.warn(
            `No occurrences generated for recurring transaction: ${recurring.id}`,
          );
          skippedCount++;
        }

        if (occurrenceCount >= maxOccurrences) {
          console.warn(
            `Reached maximum occurrences (${maxOccurrences}) for recurring transaction: ${recurring.id}`,
          );
        }
      } catch (err) {
        console.error(
          `Error processing recurring transaction ${recurring.id}:`,
          err,
        );
        skippedCount++;
      }
    });

    console.log(
      `Upcoming expenses: processed ${processedCount} recurring transactions, skipped ${skippedCount}`,
    );
    console.log(`Generated ${upcoming.length} upcoming expense occurrences`);

    // Sort by date
    return upcoming.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  };

  const getForecastMonthsCount = (): number => {
    switch (forecastPeriod) {
      case "3months":
        return 3;
      case "6months":
        return 6;
      case "12months":
        return 12;
      default:
        return 3;
    }
  };

  // Helper function to format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: companySettings?.default_currency || currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchForecasts = async () => {
    if (!userId) {
      console.error("No user ID available");
      setError("User ID not found. Please try refreshing the page.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-features/forecasting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeframe: forecastPeriod,
          userId: userId,
          transactions: transactions,
          recurring: recurringTransactions,
          settings: {
            default_currency: companySettings?.default_currency || currency,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch forecasts");
      }

      const data = await response.json();

      if (data.success) {
        setMonthlyData(data.data.monthlyForecasts);
        setCategoryForecasts(data.data.categoryForecasts);
        setUpcomingExpenses(data.data.upcomingExpenses);
      } else {
        throw new Error(data.error || "Failed to fetch forecasts");
      }
    } catch (error) {
      console.error("Error fetching forecasts:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch forecasts",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchData();
  };

  // Replace the chart components with simpler versions
  const renderLineChart = (data: MonthlyData[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#8884d8" name="Income" />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#82ca9d"
          name="Expenses"
        />
        <Line
          type="monotone"
          dataKey="savings"
          stroke="#ffc658"
          name="Savings"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = (data: CategoryForecast[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="current" fill="#8884d8" name="Current" />
        <Bar dataKey="forecast" fill="#82ca9d" name="Forecast" />
      </BarChart>
    </ResponsiveContainer>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Future Forecasting</CardTitle>
          <CardDescription>
            Predict your future financial situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refreshData} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Future Forecasting</CardTitle>
            <CardDescription>
              AI-powered predictions based on your historical financial data
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={forecastPeriod}
              onValueChange={(value) => setForecastPeriod(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Forecast Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Next 3 Months</SelectItem>
                <SelectItem value="6months">Next 6 Months</SelectItem>
                <SelectItem value="12months">Next 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="cashflow" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="cashflow">
              <LineChartIcon className="h-4 w-4 mr-2" /> Cash Flow Forecast
            </TabsTrigger>
            <TabsTrigger value="categories">
              <BarChart3 className="h-4 w-4 mr-2" /> Category Trends
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Calendar className="h-4 w-4 mr-2" /> Upcoming Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow" className="space-y-6">
            <Card className="bg-purple-50 border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-purple-800 mb-1">
                      AI Cash Flow Prediction
                    </h3>
                    <p className="text-sm text-purple-700">
                      Based on your historical data and spending patterns, we've
                      predicted your cash flow for the next{" "}
                      {getForecastMonthsCount()} months. Predictions are shown
                      with lighter colors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-[400px] w-full">
              {renderLineChart(monthlyData)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {monthlyData
                .filter((item) => item.prediction)
                .slice(0, 3)
                .map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">
                        {item.month} Prediction
                      </div>
                      <div className="text-xl font-bold mt-2">
                        {formatCurrency(item.savings)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Net savings ({formatCurrency(item.income)} income,{" "}
                        {formatCurrency(item.expenses)} expenses)
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="bg-indigo-50 border-indigo-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-indigo-800 mb-1">
                      Category Spending Forecast
                    </h3>
                    <p className="text-sm text-indigo-700">
                      Based on your spending patterns, we've predicted how your
                      expenses in each category will change in the coming month.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-[400px] w-full">
              {renderBarChart(categoryForecasts.slice(0, 8))}
            </div>

            <div className="space-y-4">
              {categoryForecasts.map((forecast, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: forecast.color }}
                  />
                  <div className="w-32 font-medium">{forecast.category}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        Current: {formatCurrency(forecast.current)}
                      </span>
                      <span className="text-sm font-medium">
                        Forecast: {formatCurrency(forecast.forecast)}
                        {forecast.change > 0 && (
                          <span className="text-amber-600 ml-2 text-xs">
                            <ArrowUp className="h-3 w-3 inline" />{" "}
                            {forecast.change}%
                          </span>
                        )}
                        {forecast.change < 0 && (
                          <span className="text-green-600 ml-2 text-xs">
                            <ArrowDown className="h-3 w-3 inline" />{" "}
                            {Math.abs(forecast.change)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(forecast.current / Math.max(forecast.current, forecast.forecast)) * 100}%`,
                          backgroundColor: forecast.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">
                      Upcoming Expenses
                    </h3>
                    <p className="text-sm text-blue-700">
                      Based on your recurring transactions, we've predicted your
                      upcoming expenses for the next {getForecastMonthsCount()}{" "}
                      months.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {upcomingExpenses.length > 0 ? (
              <div className="space-y-4">
                {upcomingExpenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-10 rounded-full"
                            style={{ backgroundColor: expense.categoryColor }}
                          />
                          <div>
                            <h4 className="font-medium">
                              {expense.description}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {expense.category} • {formatDate(expense.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  No Upcoming Expenses
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any recurring transactions to predict
                  upcoming expenses. Add recurring transactions to see
                  predictions here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
