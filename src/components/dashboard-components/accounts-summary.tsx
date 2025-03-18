"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CurrencyCode, CURRENCY_CONFIG, formatCurrency as formatCurrencyUtil } from "@/lib/utils";
import { useContext } from "react";
import { CurrencyContext } from "@/contexts/currency-context";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  dueDate?: string;
}

interface AccountsSummaryProps {
  title?: string;
  description?: string;
  accounts?: Account[];
  type?: "receivable" | "payable";
  currency?: CurrencyCode;
  isLoading?: boolean;
}

export default function AccountsSummary({
  title = "Accounts Receivable",
  description = "Outstanding customer invoices",
  accounts = [],
  type = "receivable",
  currency: propCurrency,
  isLoading = false
}: AccountsSummaryProps) {
  // Use the currency from context if available, otherwise use the prop
  const currencyContext = useContext(CurrencyContext);
  const currency = propCurrency || currencyContext?.currency || 'USD';

  // Default accounts if none provided
  const defaultReceivables: Account[] = [];
  const defaultPayables: Account[] = [];

  const displayAccounts =
    accounts.length > 0
      ? accounts
      : type === "receivable"
        ? defaultReceivables
        : defaultPayables;

  const totalAmount = displayAccounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  const formatCurrency = (value: number) => {
    if (!currency || !CURRENCY_CONFIG[currency]) {
      return new Intl.NumberFormat('en-US', {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    return formatCurrencyUtil(value, currency, {
      minimumFractionDigits: CURRENCY_CONFIG[currency].minimumFractionDigits ?? 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate percentage of each account relative to total
  const getPercentage = (amount: number) => {
    return (amount / totalAmount) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="font-bold text-2xl">
            {formatCurrency(totalAmount)}
          </div>

          <div className="space-y-4">
            {displayAccounts.map((account) => (
              <div key={account.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm">
                    {formatCurrency(account.balance)}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div>Due {formatDate(account.dueDate)}</div>
                  <div>{Math.round(getPercentage(account.balance))}%</div>
                </div>
                <Progress
                  value={getPercentage(account.balance)}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
