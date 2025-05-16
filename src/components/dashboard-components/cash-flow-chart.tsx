"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useContext } from "react";
import {
  CurrencyCode,
  CURRENCY_CONFIG,
  formatCurrency as formatCurrencyUtil,
} from "@/lib/utils";
import { CurrencyContext } from "@/contexts/currency-context";

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

interface CashFlowChartProps {
  data?: CashFlowData[];
  currency?: CurrencyCode;
}

export default function CashFlowChart({
  data = [],
  currency: propCurrency,
}: CashFlowChartProps) {
  const [activeTab, setActiveTab] = useState("monthly");
  const [mounted, setMounted] = useState(false);

  // Use the currency from context if available, otherwise use the prop
  const currencyContext = useContext(CurrencyContext);
  const currency = propCurrency || currencyContext?.currency || "USD";

  // Default data if none provided
  const defaultData: CashFlowData[] = [];

  const displayData = data.length > 0 ? data : defaultData;

  // Calculate totals
  const totalIncome = displayData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = displayData.reduce(
    (sum, item) => sum + item.expenses,
    0,
  );
  const netCashFlow = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    if (!currency || !CURRENCY_CONFIG[currency]) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }

    return formatCurrencyUtil(value, currency, {
      minimumFractionDigits:
        CURRENCY_CONFIG[currency].minimumFractionDigits ?? 0,
      maximumFractionDigits: 0,
    });
  };

  // Find the maximum value for scaling the chart
  const maxValue = Math.max(
    ...displayData.map((item) => Math.max(item.income, item.expenses)),
  );

  // Calculate bar height as percentage of max value
  const getBarHeight = (value: number) => {
    return (value / maxValue) * 100;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Income vs. Expenses</CardDescription>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Income
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Expenses
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Net Cash Flow
              </p>
              <p
                className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(netCashFlow)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[200px] w-full">
            <div className="flex h-full items-end gap-2">
              {displayData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full flex justify-between items-end h-[160px]">
                    <div
                      className="w-[45%] bg-green-500 rounded-t"
                      style={{ height: `${getBarHeight(item.income)}%` }}
                    />
                    <div
                      className="w-[45%] bg-red-500 rounded-t"
                      style={{ height: `${getBarHeight(item.expenses)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
