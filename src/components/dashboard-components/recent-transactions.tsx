"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CurrencyCode,
  CURRENCY_CONFIG,
  formatCurrency as formatCurrencyUtil,
} from "@/lib/utils";
import { useContext } from "react";
import { CurrencyContext } from "@/contexts/currency-context";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  category: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  currency?: CurrencyCode; // Make currency optional
  isLoading?: boolean;
}

export default function RecentTransactions({
  transactions = [],
  currency: propCurrency, // Rename to propCurrency
  isLoading = false,
}: RecentTransactionsProps) {
  // Use the currency from context if available, otherwise use the prop
  const currencyContext = useContext(CurrencyContext);
  const currency = propCurrency || currencyContext?.currency || "USD";

  // Default transactions if none provided
  const defaultTransactions: Transaction[] = [];

  const displayTransactions =
    transactions.length > 0 ? transactions : defaultTransactions;

  const formatCurrency = (value: number) => {
    if (!currency || !CURRENCY_CONFIG[currency]) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value);
    }

    return formatCurrencyUtil(value, currency, {
      minimumFractionDigits:
        CURRENCY_CONFIG[currency].minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className={`h-5 w-5 text-green-600`} />
                  ) : (
                    <ArrowDownLeft className={`h-5 w-5 text-red-600`} />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </div>
                </div>
              </div>
              <div
                className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.type === "income" ? "+" : "-"}{" "}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
