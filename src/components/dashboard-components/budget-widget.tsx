"use client";

import { Budget, BudgetTracking } from "@/types/financial";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CurrencyCode,
  CURRENCY_CONFIG,
  formatCurrency as formatCurrencyUtil,
} from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import { useContext } from "react";
import { CurrencyContext } from "@/contexts/currency-context";

interface BudgetWidgetProps {
  budgets: BudgetTracking[];
  tracking: BudgetTracking[] | null;
  currency?: CurrencyCode;
  isLoading?: boolean;
}

export default function BudgetWidget({
  budgets,
  tracking,
  currency: propCurrency,
  isLoading = false,
}: BudgetWidgetProps) {
  // Use the currency from context if available, otherwise use the prop
  const currencyContext = useContext(CurrencyContext);
  const currency = propCurrency || currencyContext?.currency || "USD";

  const safeTracking = tracking || [];
  const safeBudgets = budgets || [];

  const formatCurrency = (value: number = 0) => {
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

  const totalBudget = safeBudgets.reduce(
    (sum, budget) => sum + (budget?.amount || 0),
    0,
  );
  const totalSpent = safeTracking.reduce(
    (sum, item) => sum + (item?.spent || 0),
    0,
  );
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const expenseTracking = safeTracking.filter(
    (item) => item?.category?.type === "expense",
  );
  const sortedExpenses = [...expenseTracking].sort(
    (a, b) => (b?.spent || 0) - (a?.spent || 0),
  );
  const topExpenses = sortedExpenses.slice(0, 3);

  const currentDate = new Date();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Budget Overview</CardTitle>
        <CardDescription>Your spending for {monthName}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ) : safeBudgets.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No active budgets</p>
            <Link href="/dashboard/budgets/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Budget
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Spent</span>
                <span className="text-sm font-medium">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </span>
              </div>
              <Progress value={percentSpent} className="h-2" />
            </div>

            {topExpenses.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium">Top Expenses</h4>
                {topExpenses.map((item) => {
                  const percent =
                    (item?.spent || 0) > 0
                      ? ((item?.spent || 0) / totalBudget) * 100
                      : 0;
                  const isOverBudget = percent > 100;

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">
                          {item.category?.name}
                        </span>
                        <span className="text-xs font-medium">
                          {formatCurrency(item?.spent)} /{" "}
                          {formatCurrency(totalBudget)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percent, 100)}
                        className={isOverBudget ? "bg-red-100 h-1.5" : "h-1.5"}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/dashboard/budgets" className="w-full">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            disabled={isLoading}
          >
            View All Budgets
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
