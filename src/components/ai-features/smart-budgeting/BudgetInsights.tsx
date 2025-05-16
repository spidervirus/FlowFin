import { BudgetInsight } from "@/types/budgeting";
import { CompanySettings } from "@/types/financial";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { CURRENCY_CONFIG, CurrencyCode } from "@/lib/utils";

interface BudgetInsightsProps {
  insights: BudgetInsight[];
  settings: CompanySettings | null;
}

export default function BudgetInsights({
  insights,
  settings,
}: BudgetInsightsProps) {
  const currencyCode = (settings?.default_currency || "USD") as CurrencyCode;

  // Icon mapping for different insight types
  const getIcon = (insight: BudgetInsight) => {
    switch (insight.type) {
      case "income":
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case "overspending":
        return <Wallet className="h-5 w-5 text-red-600" />;
      case "savings":
        return <PiggyBank className="h-5 w-5 text-blue-600" />;
      case "trend":
        return <BarChart3 className="h-5 w-5 text-purple-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-600" />;
    }
  };

  // Format currency based on settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currencyCode].locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight) => (
        <Card
          key={insight.id}
          className={`overflow-hidden border-l-4 ${
            insight.type === "income"
              ? "border-l-green-500"
              : insight.type === "overspending"
                ? "border-l-red-500"
                : insight.type === "savings"
                  ? "border-l-blue-500"
                  : "border-l-purple-500"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="mr-4">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon(insight)}
                  <h3 className="font-medium text-lg">{insight.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  {insight.description}
                </p>
                <div className="font-semibold text-xl">
                  {formatCurrency(insight.amount)}
                </div>
              </div>

              {insight.changePercentage !== 0 && (
                <div
                  className={`flex items-center p-2 rounded-full ${
                    insight.isPositive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {insight.isPositive ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                  <span className="ml-1 font-medium">
                    {Math.abs(insight.changePercentage).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {insight.category && (
              <div className="mt-4 flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: insight.categoryColor || "#888" }}
                />
                <span className="text-sm text-muted-foreground">
                  {insight.category}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
