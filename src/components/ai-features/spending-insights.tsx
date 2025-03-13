"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
  TooltipProps
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
  Lightbulb
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Transaction, Category } from "@/types/financial";

interface SpendingInsight {
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral" | "suggestion";
  icon: JSX.Element;
  value?: string;
  change?: number;
}

interface CategorySpending {
  name: string;
  amount: number;
  color: string;
}

interface MonthlySpending {
  month: string;
  amount: number;
}

interface CategoryData {
  id?: string;
  name?: string;
  type?: string;
  color?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function SpendingInsights() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);
  const [savingSuggestions, setSavingSuggestions] = useState<SpendingInsight[]>([]);
  const [timeframe, setTimeframe] = useState<"30days" | "90days" | "6months" | "12months">("30days");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      analyzeSpendingPatterns();
    }
  }, [transactions, categories, timeframe]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Get date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "6months":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "12months":
          startDate.setMonth(startDate.getMonth() - 12);
          break;
      }
      
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*, category:category_id(id, name, type, color)")
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0])
        .order("date", { ascending: false });
      
      if (transactionsError) {
        throw new Error(`Error fetching transactions: ${transactionsError.message}`);
      }
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true);
      
      if (categoriesError) {
        throw new Error(`Error fetching categories: ${categoriesError.message}`);
      }
      
      setTransactions(transactionsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSpendingPatterns = () => {
    // Filter expense transactions
    const expenses = transactions.filter(t => t.type === "expense");
    
    if (expenses.length === 0) {
      setInsights([{
        title: "Not enough data",
        description: "We need more transaction data to generate insights.",
        type: "neutral",
        icon: <AlertCircle className="h-5 w-5 text-gray-500" />
      }]);
      return;
    }
    
    // Calculate total spending
    const totalSpending = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate average daily spending
    const dateRange = getDateRangeInDays();
    const avgDailySpending = totalSpending / dateRange;
    
    // Group spending by category
    const categoryMap = new Map<string, number>();
    const categoryColorMap = new Map<string, string>();
    
    expenses.forEach(expense => {
      const categoryData = expense.category as CategoryData | null;
      const categoryName = categoryData?.name || "Uncategorized";
      const categoryColor = categoryData?.color || "#888888";
      
      categoryMap.set(
        categoryName, 
        (categoryMap.get(categoryName) || 0) + expense.amount
      );
      
      categoryColorMap.set(categoryName, categoryColor);
    });
    
    // Convert to array and sort by amount
    const categorySpendings: CategorySpending[] = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        color: categoryColorMap.get(name) || "#888888"
      }))
      .sort((a, b) => b.amount - a.amount);
    
    setCategorySpending(categorySpendings);
    
    // Calculate monthly spending
    const monthlyData = calculateMonthlySpending(expenses);
    setMonthlySpending(monthlyData);
    
    // Generate insights
    const newInsights: SpendingInsight[] = [];
    
    // Top spending category
    if (categorySpendings.length > 0) {
      const topCategory = categorySpendings[0];
      const topCategoryPercentage = Math.round((topCategory.amount / totalSpending) * 100);
      
      newInsights.push({
        title: "Top Spending Category",
        description: `${topCategory.name} accounts for ${topCategoryPercentage}% of your expenses.`,
        type: "neutral",
        icon: <ShoppingBag className="h-5 w-5 text-blue-500" />,
        value: formatCurrency(topCategory.amount)
      });
    }
    
    // Monthly trend
    if (monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      
      const monthlyChange = ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100;
      
      newInsights.push({
        title: "Monthly Spending Trend",
        description: monthlyChange > 0 
          ? `Your spending increased by ${Math.abs(monthlyChange).toFixed(1)}% compared to last month.`
          : `Your spending decreased by ${Math.abs(monthlyChange).toFixed(1)}% compared to last month.`,
        type: monthlyChange > 0 ? "negative" : "positive",
        icon: monthlyChange > 0 
          ? <TrendingUp className="h-5 w-5 text-red-500" />
          : <TrendingDown className="h-5 w-5 text-green-500" />,
        change: monthlyChange
      });
    }
    
    // Daily average
    newInsights.push({
      title: "Daily Average",
      description: `You spend an average of ${formatCurrency(avgDailySpending)} per day.`,
      type: "neutral",
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      value: formatCurrency(avgDailySpending)
    });
    
    // Unusual spending
    const unusualSpending = findUnusualSpending(expenses);
    if (unusualSpending) {
      newInsights.push(unusualSpending);
    }
    
    setInsights(newInsights);
    
    // Generate saving suggestions
    generateSavingSuggestions(expenses, categorySpendings);
  };

  const getDateRangeInDays = (): number => {
    switch (timeframe) {
      case "30days": return 30;
      case "90days": return 90;
      case "6months": return 180;
      case "12months": return 365;
      default: return 30;
    }
  };

  const calculateMonthlySpending = (expenses: Transaction[]): MonthlySpending[] => {
    const monthlyMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      monthlyMap.set(
        monthYear,
        (monthlyMap.get(monthYear) || 0) + expense.amount
      );
    });
    
    // Convert to array and sort by date
    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        
        if (aYear !== bYear) {
          return parseInt(aYear) - parseInt(bYear);
        }
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
  };

  const findUnusualSpending = (expenses: Transaction[]): SpendingInsight | null => {
    // Group by category and find unusually high spending
    const categoryAvg = new Map<string, number[]>();
    
    expenses.forEach(expense => {
      const categoryData = expense.category as CategoryData | null;
      const categoryName = categoryData?.name || "Uncategorized";
      
      if (!categoryAvg.has(categoryName)) {
        categoryAvg.set(categoryName, []);
      }
      
      categoryAvg.get(categoryName)?.push(expense.amount);
    });
    
    // Find category with unusually high spending
    let unusualCategory = "";
    let unusualAmount = 0;
    let unusualPercentage = 0;
    
    categoryAvg.forEach((amounts, category) => {
      if (amounts.length < 2) return;
      
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      const avg = total / amounts.length;
      
      // Find the highest amount
      const highest = Math.max(...amounts);
      
      // Calculate percentage above average
      const percentAboveAvg = ((highest - avg) / avg) * 100;
      
      if (percentAboveAvg > 50 && percentAboveAvg > unusualPercentage) {
        unusualCategory = category;
        unusualAmount = highest;
        unusualPercentage = percentAboveAvg;
      }
    });
    
    if (unusualCategory) {
      return {
        title: "Unusual Spending Detected",
        description: `Your highest ${unusualCategory} expense of ${formatCurrency(unusualAmount)} is ${Math.round(unusualPercentage)}% above your average.`,
        type: "negative",
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        value: formatCurrency(unusualAmount)
      };
    }
    
    return null;
  };

  const generateSavingSuggestions = (expenses: Transaction[], categorySpendings: CategorySpending[]) => {
    const suggestions: SpendingInsight[] = [];
    
    // Dining out suggestion
    const diningCategories = ["Dining", "Restaurants", "Food", "Coffee", "Cafe"];
    const diningExpenses = expenses.filter(e => {
      const categoryData = e.category as CategoryData | null;
      return categoryData && diningCategories.some(c => 
        categoryData.name?.toLowerCase().includes(c.toLowerCase())
      );
    });
    
    if (diningExpenses.length > 0) {
      const diningTotal = diningExpenses.reduce((sum, e) => sum + e.amount, 0);
      const diningAvg = diningTotal / getDateRangeInDays() * 30; // Monthly average
      
      if (diningAvg > 200) {
        const potentialSavings = Math.round(diningAvg * 0.3); // 30% reduction
        
        suggestions.push({
          title: "Reduce Dining Out",
          description: `You spend about ${formatCurrency(diningAvg)} monthly on dining out. Cooking at home more often could save you around ${formatCurrency(potentialSavings)} per month.`,
          type: "suggestion",
          icon: <Utensils className="h-5 w-5 text-green-500" />,
          value: formatCurrency(potentialSavings)
        });
      }
    }
    
    // Subscription suggestion
    const subscriptionKeywords = ["subscription", "netflix", "spotify", "hulu", "disney", "apple", "amazon prime", "membership"];
    const subscriptionExpenses = expenses.filter(e => 
      subscriptionKeywords.some(keyword => 
        e.description.toLowerCase().includes(keyword)
      )
    );
    
    if (subscriptionExpenses.length > 0) {
      const subscriptionTotal = subscriptionExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      suggestions.push({
        title: "Review Subscriptions",
        description: `You've spent ${formatCurrency(subscriptionTotal)} on subscriptions. Consider reviewing which ones you actually use regularly.`,
        type: "suggestion",
        icon: <CreditCard className="h-5 w-5 text-green-500" />,
        value: formatCurrency(subscriptionTotal)
      });
    }
    
    // Coffee suggestion
    const coffeeKeywords = ["coffee", "starbucks", "cafe", "latte", "espresso"];
    const coffeeExpenses = expenses.filter(e => 
      coffeeKeywords.some(keyword => 
        e.description.toLowerCase().includes(keyword)
      )
    );
    
    if (coffeeExpenses.length >= 5) {
      const coffeeTotal = coffeeExpenses.reduce((sum, e) => sum + e.amount, 0);
      const coffeeAvg = coffeeTotal / getDateRangeInDays() * 30; // Monthly average
      
      if (coffeeAvg > 50) {
        suggestions.push({
          title: "Coffee Expenses",
          description: `You spend about ${formatCurrency(coffeeAvg)} monthly on coffee. Making coffee at home could save you around ${formatCurrency(Math.round(coffeeAvg * 0.7))} per month.`,
          type: "suggestion",
          icon: <Coffee className="h-5 w-5 text-green-500" />,
          value: formatCurrency(Math.round(coffeeAvg * 0.7))
        });
      }
    }
    
    // General saving suggestion based on top category
    if (categorySpendings.length > 0) {
      const topCategory = categorySpendings[0];
      const potentialSavings = Math.round(topCategory.amount * 0.1); // 10% reduction
      
      suggestions.push({
        title: `Reduce ${topCategory.name} Expenses`,
        description: `Your highest spending category is ${topCategory.name}. Reducing these expenses by just 10% would save you ${formatCurrency(potentialSavings)}.`,
        type: "suggestion",
        icon: <PiggyBank className="h-5 w-5 text-green-500" />,
        value: formatCurrency(potentialSavings)
      });
    }
    
    // Add a general tip
    suggestions.push({
      title: "50/30/20 Rule",
      description: "Consider following the 50/30/20 budget rule: 50% on needs, 30% on wants, and 20% on savings and debt repayment.",
      type: "suggestion",
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />
    });
    
    setSavingSuggestions(suggestions);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const refreshData = () => {
    fetchData();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Spending Insights</CardTitle>
            <CardDescription>
              AI-powered analysis of your spending patterns
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={refreshData}>
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
                  variant={timeframe === "30days" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setTimeframe("30days")}
                >
                  30 Days
                </Button>
                <Button 
                  variant={timeframe === "90days" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setTimeframe("90days")}
                >
                  90 Days
                </Button>
                <Button 
                  variant={timeframe === "6months" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setTimeframe("6months")}
                >
                  6 Months
                </Button>
                <Button 
                  variant={timeframe === "12months" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setTimeframe("12months")}
                >
                  12 Months
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="insights">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="insights">Key Insights</TabsTrigger>
                <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
                <TabsTrigger value="suggestions">Saving Suggestions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insights" className="space-y-4 pt-4">
                {insights.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No insights available</h3>
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
                            <div className={`p-2 rounded-full ${
                              insight.type === "positive" ? "bg-green-100" :
                              insight.type === "negative" ? "bg-red-100" :
                              insight.type === "suggestion" ? "bg-blue-100" : "bg-gray-100"
                            }`}>
                              {insight.icon}
                            </div>
                            <div>
                              <CardTitle className="text-base">{insight.title}</CardTitle>
                              {insight.value && (
                                <div className="text-2xl font-bold mt-1">{insight.value}</div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <p className="text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                            {insight.change !== undefined && (
                              <Badge className={insight.change > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                {insight.change > 0 ? "+" : ""}{insight.change.toFixed(1)}%
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {monthlySpending.length > 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Monthly Spending Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={monthlySpending}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip 
                                  formatter={(value: number) => [`${formatCurrency(value)}`, "Amount"]}
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
                    <h3 className="text-lg font-medium">No category data available</h3>
                    <p className="text-muted-foreground">
                      We need more transaction data to show category breakdown.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Spending by Category</CardTitle>
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
                                nameKey="name"
                                label={({ name, percent }: { name: string, percent: number }) => 
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {categorySpending.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Spending Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {categorySpending.slice(0, 5).map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}></div>
                                <span>{category.name}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(category.amount)}</span>
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
                    <h3 className="text-lg font-medium">No suggestions available</h3>
                    <p className="text-muted-foreground">
                      We need more transaction data to generate saving suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savingSuggestions.map((suggestion, index) => (
                      <Card key={index} className="overflow-hidden border-l-4 border-l-green-500">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-2">
                          <div className="p-2 rounded-full bg-green-100">
                            {suggestion.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{suggestion.title}</CardTitle>
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
                        Setting up automatic transfers to a savings account on payday can help you save before you have a chance to spend.
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
          These insights are generated based on your transaction history and are meant to help you understand your spending patterns. For professional financial advice, please consult a financial advisor.
        </p>
      </CardFooter>
    </Card>
  );
} 