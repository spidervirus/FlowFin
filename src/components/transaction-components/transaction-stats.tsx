"use client";

import { Transaction } from "@/types/financial";
import { CurrencyCode, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TransactionStatsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function TransactionStats({
  transactions,
  currency,
}: TransactionStatsProps) {
  const calculateStats = () => {
    const stats = transactions.reduce(
      (acc, transaction) => {
        const amount = transaction.amount;
        if (transaction.type === "income") {
          acc.totalIncome += amount;
          if (amount > acc.highestIncome) acc.highestIncome = amount;
        } else {
          acc.totalExpenses += amount;
          if (amount > acc.highestExpense) acc.highestExpense = amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, highestIncome: 0, highestExpense: 0 },
    );

    return {
      ...stats,
      netIncome: stats.totalIncome - stats.totalExpenses,
      transactionCount: transactions.length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(stats.totalIncome, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Highest: {formatCurrency(stats.highestIncome, currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(stats.totalExpenses, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Highest: {formatCurrency(stats.highestExpense, currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${stats.netIncome >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {formatCurrency(stats.netIncome, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {stats.transactionCount} transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(
              stats.transactionCount > 0
                ? (stats.totalIncome + stats.totalExpenses) /
                    stats.transactionCount
                : 0,
              currency,
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Total transactions: {stats.transactionCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
