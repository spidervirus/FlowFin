import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from "lucide-react";

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
}

export default function RecentTransactions({
  transactions = [],
}: RecentTransactionsProps) {
  // Default transactions if none provided
  const defaultTransactions: Transaction[] = [
    {
      id: "1",
      description: "Client Payment - ABC Corp",
      amount: 2500,
      date: "2023-06-15",
      type: "income",
      category: "Sales",
    },
    {
      id: "2",
      description: "Office Supplies",
      amount: 125.5,
      date: "2023-06-14",
      type: "expense",
      category: "Office",
    },
    {
      id: "3",
      description: "Software Subscription",
      amount: 49.99,
      date: "2023-06-13",
      type: "expense",
      category: "Software",
    },
    {
      id: "4",
      description: "Client Payment - XYZ Ltd",
      amount: 1800,
      date: "2023-06-12",
      type: "income",
      category: "Sales",
    },
    {
      id: "5",
      description: "Utility Bill",
      amount: 210.75,
      date: "2023-06-10",
      type: "expense",
      category: "Utilities",
    },
  ];

  const displayTransactions =
    transactions.length > 0 ? transactions : defaultTransactions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
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
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
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
