"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
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
  TooltipProps
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
  PieChart
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Transaction, Category } from "@/types/financial";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  category?: {
    name: string;
    color: string;
  };
}

export default function FutureForecasting() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryForecasts, setCategoryForecasts] = useState<CategoryForecast[]>([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState<UpcomingExpense[]>([]);
  const [forecastPeriod, setForecastPeriod] = useState<"3months" | "6months" | "12months">("3months");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      generateForecasts();
    }
  }, [transactions, categories, forecastPeriod]);

  // Helper function to check if category is an object
  const isCategoryObject = (category: Transaction['category']): category is { id: string; name: string; type: string; color?: string } => {
    return typeof category !== 'string';
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)  // Only get active categories
        .order("name");
      
      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        throw categoriesError;
      }
      
      // Fetch transactions for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0];
      
      console.log("Fetching transactions since:", twelveMonthsAgoStr);
      
      // First try with the join
      let transactionsData;
      let transactionsError;
      
      try {
        const result = await supabase
          .from("transactions")
          .select(`
            *,
            category:categories(id, name, type, color)
          `)
          .gte("date", twelveMonthsAgoStr)
          .order("date", { ascending: false });
          
        transactionsData = result.data;
        transactionsError = result.error;
      } catch (err) {
        console.error("Error with joined transaction query:", err);
        
        // Fallback to simpler query if the join fails
        const fallbackResult = await supabase
          .from("transactions")
          .select("*")
          .gte("date", twelveMonthsAgoStr)
          .order("date", { ascending: false });
          
        transactionsData = fallbackResult.data;
        transactionsError = fallbackResult.error;
      }
      
      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        throw transactionsError;
      }
      
      // Fetch recurring transactions
      const { data: recurringData, error: recurringError } = await supabase
        .from("recurring_transactions")
        .select(`
          *,
          category:categories(id, name, type, color)
        `)
        .eq("is_active", true);
      
      if (recurringError) {
        console.error("Error fetching recurring transactions:", recurringError);
        throw recurringError;
      }
      
      console.log("Categories data:", categoriesData?.length || 0, "items");
      console.log("Transactions data:", transactionsData?.length || 0, "items");
      console.log("Recurring data:", recurringData?.length || 0, "items");
      
      // Log a sample transaction to debug category structure
      if (transactionsData && transactionsData.length > 0) {
        console.log("Sample transaction:", JSON.stringify(transactionsData[0], null, 2));
      }
      
      // Ensure we have arrays even if the data is null
      setCategories(categoriesData || []);
      setTransactions(transactionsData || []);
      
      // Generate upcoming expenses from recurring transactions
      if (recurringData && recurringData.length > 0) {
        try {
          const upcoming = generateUpcomingExpenses(recurringData);
          setUpcomingExpenses(upcoming);
        } catch (upcomingError) {
          console.error("Error generating upcoming expenses:", upcomingError);
          // Don't throw here, just log the error and continue
        }
      } else {
        setUpcomingExpenses([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const generateForecasts = () => {
    try {
      // Generate monthly historical and forecast data
      const monthly = generateMonthlyData();
      setMonthlyData(monthly);
      
      // Generate category forecasts
      const forecasts = generateCategoryForecasts();
      setCategoryForecasts(forecasts);
    } catch (err) {
      console.error("Error generating forecasts:", err);
      setError("Failed to generate forecasts. Please try again.");
    }
  };

  const generateMonthlyData = (): MonthlyData[] => {
    // Group transactions by month
    const monthlyTransactions: Record<string, { income: number; expenses: number }> = {};
    
    if (!transactions || transactions.length === 0) {
      console.warn("No transactions available for generating monthly data");
      return [];
    }
    
    // Count how many transactions we process successfully
    let processedCount = 0;
    let skippedCount = 0;
    
    transactions.forEach(transaction => {
      try {
        if (!transaction.date) {
          console.warn("Transaction missing date:", transaction.id);
          skippedCount++;
          return;
        }
        
        if (typeof transaction.amount !== 'number' && isNaN(Number(transaction.amount))) {
          console.warn("Transaction has invalid amount:", transaction.id, transaction.amount);
          skippedCount++;
          return;
        }
        
        const month = transaction.date.substring(0, 7); // YYYY-MM format
        
        if (!monthlyTransactions[month]) {
          monthlyTransactions[month] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
          monthlyTransactions[month].income += Number(transaction.amount);
          processedCount++;
        } else if (transaction.type === 'expense') {
          monthlyTransactions[month].expenses += Number(transaction.amount);
          processedCount++;
        } else {
          // Skip transfers or other types
          skippedCount++;
        }
      } catch (err) {
        console.error("Error processing transaction for monthly data:", err, transaction);
        skippedCount++;
      }
    });
    
    console.log(`Monthly data: processed ${processedCount} transactions, skipped ${skippedCount}`);
    
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
      return sortedMonths.map(month => {
        const { income, expenses } = monthlyTransactions[month];
        const savings = income - expenses;
        
        // Format month for display (e.g., "Jan 2023")
        const date = new Date(month + "-01");
        const formattedMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        return {
          month: formattedMonth,
          income,
          expenses,
          savings,
          prediction: false
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
    const avgExpenseChange = changeCount > 0 ? expenseChangeSum / changeCount : 0;
    
    console.log(`Average monthly changes: income ${(avgIncomeChange * 100).toFixed(2)}%, expenses ${(avgExpenseChange * 100).toFixed(2)}%`);
    
    // Create historical data
    const historicalData: MonthlyData[] = recentMonths.map(month => {
      const { income, expenses } = monthlyTransactions[month];
      const savings = income - expenses;
      
      // Format month for display (e.g., "Jan 2023")
      const date = new Date(month + "-01");
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: formattedMonth,
        income,
        expenses,
        savings,
        prediction: false
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
          const lastDate = new Date(recentMonths[recentMonths.length - 1] + "-01");
          lastDate.setMonth(lastDate.getMonth() + i);
          const nextMonth = lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          // Apply trend to forecast
          const forecastIncome = Math.round(lastIncome * (1 + avgIncomeChange));
          const forecastExpenses = Math.round(lastExpenses * (1 + avgExpenseChange));
          const forecastSavings = forecastIncome - forecastExpenses;
          
          forecastData.push({
            month: nextMonth,
            income: forecastIncome,
            expenses: forecastExpenses,
            savings: forecastSavings,
            prediction: true
          });
          
          // Update for next iteration
          lastIncome = forecastIncome;
          lastExpenses = forecastExpenses;
        } catch (err) {
          console.error("Error generating forecast for month:", err);
        }
      }
    }
    
    console.log(`Generated ${historicalData.length} historical data points and ${forecastData.length} forecast data points`);
    
    return [...historicalData, ...forecastData];
  };

  const generateCategoryForecasts = (): CategoryForecast[] => {
    // Group transactions by category and month
    const categoryMonthlyData: Record<string, Record<string, number>> = {};
    
    if (!transactions || transactions.length === 0) {
      console.warn("No transactions available for generating category forecasts");
      return [];
    }
    
    // Count how many transactions we process successfully
    let processedCount = 0;
    let skippedCount = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category) {
        try {
          // Handle both string category IDs and object categories
          let categoryId: string;
          let categoryObj: { id: string; name: string; type: string; color?: string } | null = null;
          
          if (isCategoryObject(transaction.category)) {
            categoryId = transaction.category.id;
            categoryObj = transaction.category;
          } else {
            // If category is just a string ID, look it up in the categories array
            categoryId = transaction.category;
            const foundCategory = categories.find(c => c.id === categoryId);
            if (foundCategory) {
              categoryObj = {
                id: foundCategory.id,
                name: foundCategory.name,
                type: foundCategory.type,
                color: foundCategory.color
              };
            }
          }
          
          if (!categoryId) {
            console.warn("Transaction category missing ID:", transaction.id);
            skippedCount++;
            return;
          }
          
          if (!transaction.date) {
            console.warn("Transaction missing date:", transaction.id);
            skippedCount++;
            return;
          }
          
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
          console.error("Error processing transaction for category forecast:", err, transaction);
          skippedCount++;
          // Continue with the next transaction
        }
      }
    });
    
    console.log(`Category forecasts: processed ${processedCount} transactions, skipped ${skippedCount}`);
    
    // Calculate trends and forecasts for each category
    const forecasts: CategoryForecast[] = [];
    
    Object.entries(categoryMonthlyData).forEach(([categoryId, monthlyData]) => {
      try {
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
          console.warn(`Category not found for ID: ${categoryId}`);
          return;
        }
        
        // Sort months
        const sortedMonths = Object.keys(monthlyData).sort();
        
        // Need at least 3 months of data for meaningful forecast
        if (sortedMonths.length < 3) {
          console.log(`Not enough monthly data for category ${category.name} (${sortedMonths.length} months)`);
          return;
        }
        
        // Get the last 3 months of data
        const recentMonths = sortedMonths.slice(-3);
        const recentValues = recentMonths.map(month => monthlyData[month]);
        
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
        const currentSpending = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
        
        // Forecast next month
        const forecastSpending = Math.round(currentSpending * (1 + avgChange));
        
        // Determine trend
        let trend: "up" | "down" | "stable" = "stable";
        if (avgChange > 0.05) trend = "up";
        else if (avgChange < -0.05) trend = "down";
        
        forecasts.push({
          category: category.name,
          categoryId,
          color: category.color || '#888888',
          current: Math.round(currentSpending),
          forecast: forecastSpending,
          change: Math.round(avgChange * 100),
          trend
        });
      } catch (err) {
        console.error(`Error processing forecast for category ID ${categoryId}:`, err);
      }
    });
    
    console.log(`Generated ${forecasts.length} category forecasts`);
    
    // Sort by forecast amount (descending)
    return forecasts.sort((a, b) => b.forecast - a.forecast);
  };

  const generateUpcomingExpenses = (recurringTransactions: RecurringTransaction[]): UpcomingExpense[] => {
    if (!recurringTransactions || recurringTransactions.length === 0) {
      console.warn("No recurring transactions available for generating upcoming expenses");
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
    
    recurringTransactions.forEach(recurring => {
      if (recurring.type !== 'expense') return;
      
      const startDate = new Date(recurring.start_date);
      let nextDate = new Date(startDate);
      
      // Find the next occurrence after today
      while (nextDate < today) {
        if (recurring.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurring.frequency === 'biweekly') {
          nextDate.setDate(nextDate.getDate() + 14);
        } else if (recurring.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (recurring.frequency === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (recurring.frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      }
      
      // Add all occurrences within the forecast period
      while (nextDate <= forecastEndDate) {
        upcoming.push({
          id: `${recurring.id}-${nextDate.toISOString()}`,
          description: recurring.description,
          amount: recurring.amount,
          date: nextDate.toISOString().split('T')[0],
          category: recurring.category?.name || 'Uncategorized',
          categoryColor: recurring.category?.color || '#888888',
          isRecurring: true
        });
        
        // Move to next occurrence
        if (recurring.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurring.frequency === 'biweekly') {
          nextDate.setDate(nextDate.getDate() + 14);
        } else if (recurring.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (recurring.frequency === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (recurring.frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          break; // Unknown frequency
        }
      }
    });
    
    // Sort by date
    return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getForecastMonthsCount = (): number => {
    switch (forecastPeriod) {
      case "3months": return 3;
      case "6months": return 6;
      case "12months": return 12;
      default: return 3;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const refreshData = () => {
    fetchData();
  };

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
          <CardDescription>Predict your future financial situation</CardDescription>
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
                    <h3 className="font-medium text-purple-800 mb-1">AI Cash Flow Prediction</h3>
                    <p className="text-sm text-purple-700">
                      Based on your historical data and spending patterns, we've predicted your 
                      cash flow for the next {getForecastMonthsCount()} months. Predictions are shown with lighter colors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  {monthlyData.map((entry, index) => (
                    <Line
                      key={`income-${index}`}
                      type="monotone"
                      dataKey="income"
                      name={index === 0 ? "Income" : ""}
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      strokeDasharray={entry.prediction ? "5 5" : "0"}
                      data={[entry]}
                    />
                  ))}
                  {monthlyData.map((entry, index) => (
                    <Line
                      key={`expenses-${index}`}
                      type="monotone"
                      dataKey="expenses"
                      name={index === 0 ? "Expenses" : ""}
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      strokeDasharray={entry.prediction ? "5 5" : "0"}
                      data={[entry]}
                    />
                  ))}
                  {monthlyData.map((entry, index) => (
                    <Line
                      key={`savings-${index}`}
                      type="monotone"
                      dataKey="savings"
                      name={index === 0 ? "Savings" : ""}
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      strokeDasharray={entry.prediction ? "5 5" : "0"}
                      data={[entry]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {monthlyData
                .filter(item => item.prediction)
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
                    <h3 className="font-medium text-indigo-800 mb-1">Category Spending Forecast</h3>
                    <p className="text-sm text-indigo-700">
                      Based on your spending patterns, we've predicted how your expenses in each category 
                      will change in the coming month.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryForecasts.slice(0, 8)} // Show top 8 categories
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis type="category" dataKey="category" width={100} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="current" name="Current Monthly" fill="#94a3b8" />
                  <Bar dataKey="forecast" name="Forecast" fill="#818cf8" />
                </BarChart>
              </ResponsiveContainer>
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
                          backgroundColor: forecast.color
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
                    <h3 className="font-medium text-blue-800 mb-1">Upcoming Expenses</h3>
                    <p className="text-sm text-blue-700">
                      Based on your recurring transactions, we've predicted your upcoming expenses 
                      for the next {getForecastMonthsCount()} months.
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
                            <h4 className="font-medium">{expense.description}</h4>
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
                <h3 className="text-lg font-medium mb-2">No Upcoming Expenses</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any recurring transactions to predict upcoming expenses.
                  Add recurring transactions to see predictions here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 