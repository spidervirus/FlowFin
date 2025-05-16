"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CurrencyCode,
  CURRENCY_CONFIG,
  formatCurrency as formatCurrencyUtil,
} from "@/lib/utils";
import { useContext } from "react";
import { CurrencyContext } from "@/contexts/currency-context";

interface FinancialOverviewCardProps {
  title?: string;
  amount?: number;
  percentageChange?: number;
  timeframe?: string;
  type?: "income" | "expense" | "profit" | "balance";
  currency?: CurrencyCode;
  isLoading?: boolean;
}

export default function FinancialOverviewCard({
  title = "Total Revenue",
  amount = 0,
  percentageChange = 0,
  timeframe = "from last month",
  type = "income",
  currency: propCurrency,
  isLoading = false,
}: FinancialOverviewCardProps) {
  // Use the currency from context if available, otherwise use the prop
  const currencyContext = useContext(CurrencyContext);
  const currency = propCurrency || currencyContext?.currency || "USD";

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = percentageChange >= 0;

  const getIcon = () => {
    switch (type) {
      case "income":
        return <TrendingUp className="h-4 w-4" />;
      case "expense":
        return <TrendingDown className="h-4 w-4" />;
      case "profit":
        return <DollarSign className="h-4 w-4" />;
      case "balance":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "income":
        return "text-green-500";
      case "expense":
        return "text-red-500";
      case "profit":
        return isPositive ? "text-green-500" : "text-red-500";
      case "balance":
        return "text-blue-500";
      default:
        return "text-green-500";
    }
  };

  const getChangeColor = () => {
    if (type === "expense") {
      return !isPositive ? "text-green-500" : "text-red-500";
    }
    return isPositive ? "text-green-500" : "text-red-500";
  };

  const formatCurrency = (value: number) => {
    if (!currency || !CURRENCY_CONFIG[currency]) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }

    // For RTL languages like Arabic, we need to ensure proper formatting
    const config = CURRENCY_CONFIG[currency];

    // Use the utility function for consistent formatting
    return formatCurrencyUtil(value, currency, {
      minimumFractionDigits: config.minimumFractionDigits ?? 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
          <div className="flex items-center gap-1">
            <div className={`flex items-center ${getChangeColor()}`}>
              {isPositive ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>{Math.abs(percentageChange)}%</span>
            </div>
            <div className="text-sm text-muted-foreground">{timeframe}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
