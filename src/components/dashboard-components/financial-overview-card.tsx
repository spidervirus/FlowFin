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

interface FinancialOverviewCardProps {
  title: string;
  amount: number;
  percentageChange: number;
  timeframe: string;
  type: "income" | "expense" | "profit" | "balance";
}

export default function FinancialOverviewCard({
  title = "Total Revenue",
  amount = 24500,
  percentageChange = 12.5,
  timeframe = "from last month",
  type = "income",
}: FinancialOverviewCardProps) {
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
