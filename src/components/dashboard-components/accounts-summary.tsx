import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: "receivable" | "payable";
  dueDate?: string;
}

interface AccountsSummaryProps {
  title: string;
  description: string;
  accounts: Account[];
  type: "receivable" | "payable";
}

export default function AccountsSummary({
  title = "Accounts Receivable",
  description = "Outstanding customer invoices",
  accounts = [],
  type = "receivable",
}: AccountsSummaryProps) {
  // Default accounts if none provided
  const defaultReceivables = [
    {
      id: "1",
      name: "ABC Corporation",
      balance: 5000,
      type: "receivable",
      dueDate: "2023-07-15",
    },
    {
      id: "2",
      name: "XYZ Ltd",
      balance: 3200,
      type: "receivable",
      dueDate: "2023-07-20",
    },
    {
      id: "3",
      name: "Acme Inc",
      balance: 1800,
      type: "receivable",
      dueDate: "2023-07-25",
    },
  ];

  const defaultPayables = [
    {
      id: "1",
      name: "Office Supplies Co",
      balance: 850,
      type: "payable",
      dueDate: "2023-07-10",
    },
    {
      id: "2",
      name: "Tech Solutions",
      balance: 2400,
      type: "payable",
      dueDate: "2023-07-15",
    },
    {
      id: "3",
      name: "Utility Provider",
      balance: 320,
      type: "payable",
      dueDate: "2023-07-20",
    },
  ];

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
