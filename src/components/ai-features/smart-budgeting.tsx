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
  Legend
} from "recharts";
import { 
  Lightbulb, 
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
  Check,
  Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Transaction, Category } from "@/types/financial";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { toast } from "sonner";

interface BudgetRecommendation {
  category: string;
  categoryId: string;
  currentSpending: number;
  recommendedBudget: number;
  reason: string;
  icon: JSX.Element;
  color: string;
}

interface CategorySpending {
  name: string;
  amount: number;
  color: string;
}

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  address: string;
  country: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
  industry: string;
  created_at: string;
  updated_at: string;
}

interface SmartBudgetingProps {
  currency: CurrencyCode;
}

export default function SmartBudgeting({ currency }: SmartBudgetingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);
  const [totalMonthlyExpenses, setTotalMonthlyExpenses] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0.2); // 20% of income by default
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setError("Please sign in to access this feature");
        setIsLoading(false);
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
      } else {
        setSettings(settingsData);
      }
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      
      if (categoriesError) throw categoriesError;
      
      // Fetch transactions for the last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(id, name, type, color)
        `)
        .eq("user_id", user.id)
        .gte("date", threeMonthsAgo.toISOString().split('T')[0])
        .order("date", { ascending: false });
      
      if (transactionsError) throw transactionsError;
      
      setCategories(categoriesData);
      setTransactions(transactionsData);
      
      // Calculate spending by category
      const spending = calculateCategorySpending(transactionsData);
      setCategorySpending(spending);
      
      // Calculate total monthly income and expenses
      const { income, expenses } = calculateMonthlyTotals(transactionsData);
      setTotalMonthlyIncome(income);
      setTotalMonthlyExpenses(expenses);
      
      // Generate budget recommendations
      const recs = generateBudgetRecommendations(
        transactionsData, 
        categoriesData, 
        income
      );
      setRecommendations(recs);
      
      setIsLoading(false);
      toast.success("Data loaded successfully");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      setIsLoading(false);
      toast.error("Failed to load data");
    }
  };

  // Helper function to check if category is an object
  const isCategoryObject = (category: Transaction['category']): category is { id: string; name: string; type: string; color?: string } => {
    return typeof category !== 'string';
  };

  const calculateCategorySpending = (transactions: Transaction[]): CategorySpending[] => {
    const spending: Record<string, { amount: number; color: string; name: string }> = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category) {
        if (isCategoryObject(transaction.category)) {
          const categoryName = transaction.category.name;
          const categoryColor = transaction.category.color || '#888888';
          
          if (!spending[categoryName]) {
            spending[categoryName] = { amount: 0, color: categoryColor, name: categoryName };
          }
          
          spending[categoryName].amount += Number(transaction.amount);
        }
      }
    });
    
    return Object.values(spending).sort((a, b) => b.amount - a.amount);
  };

  const calculateMonthlyTotals = (transactions: Transaction[]) => {
    // Group transactions by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach(transaction => {
      const month = transaction.date.substring(0, 7); // YYYY-MM format
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[month].income += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        monthlyData[month].expenses += Number(transaction.amount);
      }
    });
    
    // Calculate average monthly income and expenses
    const months = Object.keys(monthlyData);
    const totalIncome = months.reduce((sum, month) => sum + monthlyData[month].income, 0);
    const totalExpenses = months.reduce((sum, month) => sum + monthlyData[month].expenses, 0);
    
    const avgMonthlyIncome = months.length > 0 ? totalIncome / months.length : 0;
    const avgMonthlyExpenses = months.length > 0 ? totalExpenses / months.length : 0;
    
    return { income: avgMonthlyIncome, expenses: avgMonthlyExpenses };
  };

  const generateBudgetRecommendations = (
    transactions: Transaction[], 
    categories: Category[], 
    monthlyIncome: number
  ): BudgetRecommendation[] => {
    // Calculate average monthly spending by category
    const monthlySpendingByCategory: Record<string, { 
      amount: number; 
      count: number; 
      category: { id: string; name: string; type: string; color?: string };
    }> = {};
    
    // Group transactions by month and category
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category) {
        if (isCategoryObject(transaction.category)) {
          const month = transaction.date.substring(0, 7); // YYYY-MM format
          const categoryId = transaction.category.id;
          
          if (!monthlySpendingByCategory[categoryId]) {
            monthlySpendingByCategory[categoryId] = { 
              amount: 0, 
              count: 0, 
              category: transaction.category 
            };
          }
          
          monthlySpendingByCategory[categoryId].amount += Number(transaction.amount);
          monthlySpendingByCategory[categoryId].count += 1;
        }
      }
    });
    
    // Calculate recommended budget for each category
    const recommendations: BudgetRecommendation[] = [];
    
    // Calculate total of all average spending
    const totalMonthlySpending = Object.values(monthlySpendingByCategory).reduce(
      (sum, { amount }) => sum + amount, 
      0
    );
    
    // Adjust recommendations based on 50/30/20 rule
    // 50% for needs, 30% for wants, 20% for savings
    const targetSavings = monthlyIncome * savingsGoal;
    const availableBudget = monthlyIncome - targetSavings;
    
    // Categorize spending into needs and wants
    const needsCategories = ['Housing', 'Utilities', 'Groceries', 'Healthcare', 'Transportation'];
    const needs: Record<string, any> = {};
    const wants: Record<string, any> = {};
    
    Object.entries(monthlySpendingByCategory).forEach(([categoryId, data]) => {
      const categoryName = data.category.name;
      if (needsCategories.some(need => categoryName.includes(need))) {
        needs[categoryId] = data;
      } else {
        wants[categoryId] = data;
      }
    });
    
    // Calculate total needs and wants spending
    const totalNeeds = Object.values(needs).reduce((sum, { amount }) => sum + amount, 0);
    const totalWants = Object.values(wants).reduce((sum, { amount }) => sum + amount, 0);
    
    // Target allocation
    const targetNeeds = monthlyIncome * 0.5;
    const targetWants = monthlyIncome * 0.3;
    
    // Adjustment factors
    const needsAdjustment = totalNeeds > 0 ? targetNeeds / totalNeeds : 1;
    const wantsAdjustment = totalWants > 0 ? targetWants / totalWants : 1;
    
    // Generate recommendations
    Object.entries(needs).forEach(([categoryId, data]) => {
      const currentSpending = data.amount;
      const recommendedBudget = Math.round(currentSpending * needsAdjustment);
      
      recommendations.push({
        category: data.category.name,
        categoryId,
        currentSpending,
        recommendedBudget,
        reason: needsAdjustment < 1 
          ? "Slightly reduce to meet 50/30/20 budget rule" 
          : "Essential expense maintained within budget",
        icon: getCategoryIcon(data.category.name),
        color: data.category.color || '#888888'
      });
    });
    
    Object.entries(wants).forEach(([categoryId, data]) => {
      const currentSpending = data.amount;
      const recommendedBudget = Math.round(currentSpending * wantsAdjustment);
      
      recommendations.push({
        category: data.category.name,
        categoryId,
        currentSpending,
        recommendedBudget,
        reason: wantsAdjustment < 1 
          ? "Reduce to meet 50/30/20 budget rule" 
          : "Discretionary expense within budget",
        icon: getCategoryIcon(data.category.name),
        color: data.category.color || '#888888'
      });
    });
    
    return recommendations.sort((a, b) => b.currentSpending - a.currentSpending);
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('food') || name.includes('dining') || name.includes('restaurant')) {
      return <Utensils className="h-4 w-4" />;
    } else if (name.includes('coffee') || name.includes('cafe')) {
      return <Coffee className="h-4 w-4" />;
    } else if (name.includes('shopping') || name.includes('retail')) {
      return <ShoppingBag className="h-4 w-4" />;
    } else if (name.includes('home') || name.includes('rent') || name.includes('mortgage')) {
      return <Home className="h-4 w-4" />;
    } else if (name.includes('car') || name.includes('transport') || name.includes('gas')) {
      return <Car className="h-4 w-4" />;
    } else if (name.includes('subscription') || name.includes('service')) {
      return <CreditCard className="h-4 w-4" />;
    } else if (name.includes('saving') || name.includes('investment')) {
      return <PiggyBank className="h-4 w-4" />;
    } else {
      return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    const currencyCode = settings?.default_currency || currency;
    return new Intl.NumberFormat(CURRENCY_CONFIG[currencyCode]?.locale || 'en-US', {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: CURRENCY_CONFIG[currencyCode]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const toggleRecommendation = (categoryId: string) => {
    setSelectedRecommendations(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleCreateBudget = async () => {
    if (selectedRecommendations.length === 0) return;
    
    setCreatingBudget(true);
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        throw new Error("Please sign in to create a budget");
      }
      
      // Create a new budget
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          name: `AI Budget ${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
          description: 'Created with AI Smart Budgeting',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_recurring: true,
          recurrence_period: 'monthly',
          is_active: true
        })
        .select()
        .single();
      
      if (budgetError) throw budgetError;
      
      // Add budget categories
      const budgetCategories = selectedRecommendations.map(categoryId => {
        const recommendation = recommendations.find(r => r.categoryId === categoryId);
        return {
          budget_id: budget.id,
          category_id: categoryId,
          amount: recommendation?.recommendedBudget || 0,
          user_id: user.id
        };
      });
      
      const { error: categoriesError } = await supabase
        .from('budget_categories')
        .insert(budgetCategories);
      
      if (categoriesError) throw categoriesError;
      
      toast.success("Budget created successfully");
      
      // Redirect to the budgets page
      window.location.href = '/dashboard/budgets';
      
    } catch (err) {
      console.error("Error creating budget:", err);
      setError("Failed to create budget. Please try again.");
      setCreatingBudget(false);
      toast.error("Failed to create budget");
    }
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
          <CardTitle>Smart Budgeting</CardTitle>
          <CardDescription>AI-powered budget recommendations</CardDescription>
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
            <CardTitle>Smart Budgeting</CardTitle>
            <CardDescription>
              AI-powered budget recommendations based on your spending patterns
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMonthlyIncome)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMonthlyExpenses)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recommended Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMonthlyIncome * savingsGoal)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(savingsGoal * 100)}% of income
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 50/30/20 Rule Explanation */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">50/30/20 Budget Rule</h3>
                <p className="text-sm text-blue-700">
                  Our AI recommendations follow the 50/30/20 rule: 50% of income for needs, 
                  30% for wants, and 20% for savings. This balanced approach helps you manage 
                  expenses while building financial security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Budget Recommendations */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Recommended Budget Allocations</h3>
            <Badge variant="outline" className="ml-2">
              {selectedRecommendations.length} selected
            </Badge>
          </div>
          
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div 
                key={recommendation.categoryId}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedRecommendations.includes(recommendation.categoryId) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-full" 
                      style={{ backgroundColor: `${recommendation.color}20` }}
                    >
                      <div className="text-[var(--foreground)]">{recommendation.icon}</div>
                    </div>
                    <div>
                      <h4 className="font-medium">{recommendation.category}</h4>
                      <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                    </div>
                  </div>
                  <Button 
                    variant={selectedRecommendations.includes(recommendation.categoryId) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRecommendation(recommendation.categoryId)}
                  >
                    {selectedRecommendations.includes(recommendation.categoryId) ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Selected
                      </>
                    ) : (
                      "Select"
                    )}
                  </Button>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Current: {formatCurrency(recommendation.currentSpending)}</span>
                    <span className="font-medium">
                      Recommended: {formatCurrency(recommendation.recommendedBudget)}
                      {recommendation.recommendedBudget < recommendation.currentSpending && (
                        <span className="text-green-600 ml-2 text-xs">
                          <TrendingDown className="h-3 w-3 inline" /> 
                          {Math.round((1 - recommendation.recommendedBudget / recommendation.currentSpending) * 100)}%
                        </span>
                      )}
                      {recommendation.recommendedBudget > recommendation.currentSpending && (
                        <span className="text-blue-600 ml-2 text-xs">
                          <TrendingUp className="h-3 w-3 inline" /> 
                          {Math.round((recommendation.recommendedBudget / recommendation.currentSpending - 1) * 100)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <Progress 
                    value={(recommendation.recommendedBudget / recommendation.currentSpending) * 100} 
                    className="h-2"
                    style={{ 
                      backgroundColor: `${recommendation.color}30`,
                      "--progress-foreground": recommendation.color
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/budgets">Cancel</Link>
        </Button>
        <Button 
          onClick={handleCreateBudget} 
          disabled={selectedRecommendations.length === 0 || creatingBudget}
        >
          {creatingBudget ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Create Budget
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 