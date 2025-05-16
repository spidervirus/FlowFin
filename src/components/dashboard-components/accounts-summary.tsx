"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CurrencyCode,
  CURRENCY_CONFIG,
  formatCurrency as formatCurrencyUtil,
} from "@/lib/utils";
import { useContext } from "react";
import { CurrencyContext } from "@/contexts/currency-context";
import { type Account } from "@/types/financial";

interface AccountsSummaryProps {
  title?: string;
  description?: string;
  accounts?: Account[];
  currency?: CurrencyCode;
  isLoading?: boolean;
}

export default function AccountsSummary({
  title = "Checking Accounts",
  description = "Your primary transaction accounts",
  accounts = [],
  currency: propCurrency,
  isLoading = false,
}: AccountsSummaryProps) {
  // Use the currency from context if available, otherwise use the prop
  const currencyContext = useContext(CurrencyContext);
  const currency = propCurrency || currencyContext?.currency || "USD";

  const totalAmount = accounts.reduce(
    (sum, account) => sum + (account.balance || 0),
    0,
  );

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

  // Calculate percentage of each account relative to total
  const getPercentage = (amount: number) => {
    return totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
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
            {accounts.map((account) => (
              <div key={account.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm">
                    {formatCurrency(account.balance || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div>{account.institution || "No institution"}</div>
                  <div>{Math.round(getPercentage(account.balance || 0))}%</div>
                </div>
                <Progress
                  value={getPercentage(account.balance || 0)}
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
