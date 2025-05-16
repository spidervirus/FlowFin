"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Calendar,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  LogIn,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useForecastData } from "@/hooks/useForecastData";
import type { MonthlyData, CategoryForecast, UpcomingExpense } from "@/types/forecasting";
import { CurrencyCode, CURRENCY_CONFIG, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";

// Dynamically import heavy components
const CashFlowChart = dynamic<{
  data: MonthlyData[];
  currencyCode: CurrencyCode;
}>(() => import("./CashFlowChart"), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
  ssr: false,
});

const CategoryChart = dynamic<{
  data: CategoryForecast[];
  currencyCode: CurrencyCode;
}>(() => import("./CategoryChart"), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
  ssr: false,
});

export default function FutureForecasting() {
  const [forecastPeriod, setForecastPeriod] = useState<"3months" | "6months" | "12months">("3months");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authCheckDone, setAuthCheckDone] = useState(false);

  const {
    monthlyData,
    categoryForecasts,
    upcomingExpenses,
    isLoading,
    error,
    refreshData,
    settings,
  } = useForecastData(forecastPeriod);

  // Use currency from settings or default to USD
  const currencyCode = (settings?.default_currency || "USD") as CurrencyCode;

  // Format currency values
  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, currencyCode);
  };

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Authentication error:", userError);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!user);
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        setIsAuthenticated(false);
      } finally {
        setAuthCheckDone(true);
      }
    };

    checkAuth();
  }, []);

  const handleRefresh = async () => {
    try {
      // Verify user is authenticated before refreshing
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Authentication failed. Please sign in again.");
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      console.log("Refreshing forecasts with user ID:", user.id);

      // Show loading toast
      toast.loading("Updating forecast data...", { id: "forecast-refresh" });

      // Call refresh
      await refreshData();

      // Update toast to success
      toast.success("Forecast data updated successfully", {
        id: "forecast-refresh",
      });
    } catch (err) {
      console.error("Error refreshing forecast data:", err);
      toast.error("Failed to update forecast data", { id: "forecast-refresh" });
    }
  };

  const handlePeriodChange = (value: string) => {
    setForecastPeriod(value as "3months" | "6months" | "12months");
    toast.loading("Updating forecast period...");
  };

  // Show loading state if still checking auth or data is loading
  if (!authCheckDone || (isAuthenticated && isLoading)) {
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

  // Show authentication error if not authenticated
  if (authCheckDone && !isAuthenticated) {
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
            <LogIn className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to access forecasting features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show any other errors
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
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data available
  if (monthlyData.length === 0 && categoryForecasts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Future Forecasting</CardTitle>
          <CardDescription>
            Predict your future financial situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              We couldn't find any transaction data to generate forecasts.
              Please add transactions to see forecasting insights.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show forecast data
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Future Forecasting</CardTitle>
            <CardDescription>
              AI-powered predictions based on your historical financial data
              {settings?.company_name && ` for ${settings.company_name}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={forecastPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Forecast Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Next 3 Months</SelectItem>
                <SelectItem value="6months">Next 6 Months</SelectItem>
                <SelectItem value="12months">Next 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
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
                      {forecastPeriod === "3months"
                        ? "3"
                        : forecastPeriod === "6months"
                          ? "6"
                          : "12"}{" "}
                      months. Predictions are shown with lighter colors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CashFlowChart data={monthlyData} currencyCode={currencyCode} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {monthlyData
                .filter((item) => item.isProjected)
                .slice(0, 3)
                .map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">
                        {item.month} Prediction
                      </div>
                      <div className="text-xl font-bold mt-2">
                        {formatCurrencyValue(item.savings)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Net savings ({formatCurrencyValue(item.income)} income,{" "}
                        {formatCurrencyValue(item.expenses)} expenses)
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

            {categoryForecasts && categoryForecasts.length > 0 ? (
              <CategoryChart
                data={categoryForecasts}
                currencyCode={currencyCode}
              />
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Category Data</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't generate category forecasts from your transaction data.
                  Try adding more categorized transactions.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {categoryForecasts.map((forecast: CategoryForecast, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: forecast.category_color }}
                  />
                  <div className="w-32 font-medium">{forecast.category_name}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        Current: {formatCurrencyValue(forecast.current_amount)}
                      </span>
                      <span className="text-sm font-medium">
                        Forecast: {formatCurrencyValue(forecast.forecast_amount)}
                        {forecast.percentage_change > 0 && (
                          <span className="text-amber-600 ml-2 text-xs">
                            <ArrowUp className="h-3 w-3 inline" /> {forecast.percentage_change}%
                          </span>
                        )}
                        {forecast.percentage_change < 0 && (
                          <span className="text-green-600 ml-2 text-xs">
                            <ArrowDown className="h-3 w-3 inline" />{" "}
                            {Math.abs(forecast.percentage_change)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(forecast.current_amount / Math.max(forecast.current_amount, forecast.forecast_amount)) * 100}%`,
                          backgroundColor: forecast.category_color,
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
                      upcoming expenses for the next{" "}
                      {forecastPeriod === "3months"
                        ? "3"
                        : forecastPeriod === "6months"
                          ? "6"
                          : "12"}{" "}
                      months.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {upcomingExpenses && upcomingExpenses.length > 0 ? (
              <div className="space-y-4">
                {upcomingExpenses.map((expense: UpcomingExpense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-10 rounded-full"
                            style={{ backgroundColor: expense.category_color }}
                          />
                          <div>
                            <h4 className="font-medium">{expense.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              {expense.category_name} •{" "}
                              {new Date(expense.due_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrencyValue(expense.amount)}
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
