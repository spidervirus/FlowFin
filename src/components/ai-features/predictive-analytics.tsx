"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
} from "lucide-react";

export default function PredictiveAnalytics() {
  // Sample data for cash flow prediction
  const cashFlowPrediction = [
    { month: "Jul", income: 26500, expenses: 20100, prediction: true },
    { month: "Aug", income: 27800, expenses: 20800, prediction: true },
    { month: "Sep", income: 29200, expenses: 21500, prediction: true },
  ];

  // Sample anomaly detection data
  const anomalies = [
    {
      id: "1",
      description: "Software Subscription",
      amount: 499.99,
      usual: 49.99,
      date: "2023-06-15",
      reason: "Amount is 10x higher than usual monthly payment",
    },
    {
      id: "2",
      description: "Office Supplies",
      amount: 1250.75,
      usual: 200,
      date: "2023-06-10",
      reason: "Unusually large purchase compared to historical pattern",
    },
  ];

  // Sample expense forecasts
  const expenseForecasts = [
    { category: "Rent", current: 1500, forecast: 1500, change: 0 },
    { category: "Utilities", current: 320, forecast: 380, change: 18.75 },
    { category: "Payroll", current: 4500, forecast: 4500, change: 0 },
    { category: "Software", current: 250, forecast: 300, change: 20 },
    { category: "Marketing", current: 800, forecast: 1200, change: 50 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Predictive Analytics</CardTitle>
        <CardDescription>
          Machine learning powered insights and forecasts based on your
          financial data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cashflow" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="cashflow">
              <LineChart className="h-4 w-4 mr-2" /> Cash Flow Forecast
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              <BarChart3 className="h-4 w-4 mr-2" /> Anomaly Detection
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <PieChart className="h-4 w-4 mr-2" /> Expense Forecasting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow" className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-sm">
              <p className="font-medium">AI-Generated Cash Flow Forecast</p>
              <p>
                Based on your historical data and recurring transactions, we've
                predicted your cash flow for the next 3 months.
              </p>
            </div>

            <div className="h-[300px] w-full">
              <div className="flex h-full items-end gap-2">
                {[
                  { month: "Jan", income: 18000, expenses: 14500 },
                  { month: "Feb", income: 20500, expenses: 16200 },
                  { month: "Mar", income: 19800, expenses: 15600 },
                  { month: "Apr", income: 22000, expenses: 17800 },
                  { month: "May", income: 24500, expenses: 18200 },
                  { month: "Jun", income: 26000, expenses: 19500 },
                  ...cashFlowPrediction,
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex-1 flex flex-col items-center gap-2 ${item.prediction ? "opacity-70" : ""}`}
                  >
                    <div className="w-full flex justify-between items-end h-[240px]">
                      <div
                        className={`w-[45%] ${item.prediction ? "bg-green-300" : "bg-green-500"} rounded-t`}
                        style={{ height: `${(item.income / 30000) * 100}%` }}
                      />
                      <div
                        className={`w-[45%] ${item.prediction ? "bg-red-300" : "bg-red-500"} rounded-t`}
                        style={{ height: `${(item.expenses / 30000) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {item.prediction && (
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                      )}
                      {item.month}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  AI Prediction
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {cashFlowPrediction.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      {item.month} Prediction
                    </div>
                    <div className="text-xl font-bold mt-2">
                      {formatCurrency(item.income - item.expenses)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Net cash flow ({formatCurrency(item.income)} income,{" "}
                      {formatCurrency(item.expenses)} expenses)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-800 text-sm">
              <p className="font-medium">Anomaly Detection</p>
              <p>
                Our AI has detected unusual transactions that deviate from your
                normal spending patterns.
              </p>
            </div>

            <div className="space-y-4">
              {anomalies.map((anomaly) => (
                <Card key={anomaly.id} className="border-amber-200">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <ArrowUp className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{anomaly.description}</h3>
                          <span className="font-bold text-amber-600">
                            {formatCurrency(anomaly.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {anomaly.date}
                        </p>
                        <div className="bg-amber-50 p-3 rounded-md text-sm">
                          <p className="font-medium text-amber-800">
                            Anomaly detected:
                          </p>
                          <p className="text-amber-700">{anomaly.reason}</p>
                          <p className="text-amber-700 mt-1">
                            Usual amount: {formatCurrency(anomaly.usual)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-indigo-800 text-sm">
              <p className="font-medium">AI Expense Forecasting</p>
              <p>
                Based on seasonal patterns and historical data, we've predicted
                your expenses for next month.
              </p>
            </div>

            <div className="space-y-4">
              {expenseForecasts.map((forecast, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
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
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${(forecast.current / forecast.forecast) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-indigo-800">
                    Total Forecasted Expenses
                  </h3>
                  <p className="text-sm text-indigo-700">Next month</p>
                </div>
                <div className="text-2xl font-bold text-indigo-800">
                  {formatCurrency(
                    expenseForecasts.reduce(
                      (sum, item) => sum + item.forecast,
                      0,
                    ),
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
