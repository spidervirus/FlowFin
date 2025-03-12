import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Trash,
  Plus,
  Download,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch account details
  const { data: account, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !account) {
    return redirect("/dashboard/accounts");
  }

  // Fetch recent transactions for this account
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", params.id)
    .order("date", { ascending: false })
    .limit(5);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/accounts">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{account.name}</h1>
                <p className="text-muted-foreground capitalize">
                  {account.type} Account{" "}
                  {account.account_number ? `(${account.account_number})` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/dashboard/accounts/${params.id}/reconcile`}>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reconcile
                </Button>
              </Link>
              <Link href={`/dashboard/accounts/${params.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </Link>
            </div>
          </header>

          {/* Account Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </div>
                  <div
                    className={`text-3xl font-bold mt-1 ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(account.balance)}
                  </div>
                  {account.institution && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Institution: {account.institution}
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Link
                    href={`/dashboard/transactions/new?account=${params.id}`}
                  >
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Transaction
                    </Button>
                  </Link>
                  <Link href={`/dashboard/reports/new?account=${params.id}`}>
                    <Button variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest activity in this account
                </CardDescription>
              </div>
              <Link href={`/dashboard/transactions?account=${params.id}`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="py-3 px-4">
                            {transaction.description}
                          </td>
                          <td
                            className={`py-3 px-4 font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                          >
                            {transaction.type === "income" ? "+" : "-"}{" "}
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${transaction.status === "completed" ? "bg-green-100 text-green-800" : transaction.status === "reconciled" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No transactions found for this account.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Additional information about this account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Account Type
                  </div>
                  <div className="mt-1 capitalize">{account.type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Currency
                  </div>
                  <div className="mt-1">{account.currency}</div>
                </div>
                {account.institution && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Financial Institution
                    </div>
                    <div className="mt-1">{account.institution}</div>
                  </div>
                )}
                {account.account_number && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Account Number
                    </div>
                    <div className="mt-1">xxxx-{account.account_number}</div>
                  </div>
                )}
                {account.notes && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Notes
                    </div>
                    <div className="mt-1">{account.notes}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Actions that cannot be undone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this account and all associated
                    transactions
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
