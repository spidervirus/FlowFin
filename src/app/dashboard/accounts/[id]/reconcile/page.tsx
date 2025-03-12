import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../../supabase/server";

export default async function ReconcileAccountPage({
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

  // Fetch unreconciled transactions for this account
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", params.id)
    .in("status", ["pending", "completed"])
    .order("date", { ascending: false });

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
              <Link href={`/dashboard/accounts/${params.id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Reconcile Account</h1>
                <p className="text-muted-foreground">
                  {account.name} - Match your bank statement with your records
                </p>
              </div>
            </div>
          </header>

          {/* Reconciliation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Statement Information</CardTitle>
              <CardDescription>
                Enter your bank statement details to begin reconciliation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="statement_date">Statement Date</Label>
                  <Input
                    id="statement_date"
                    name="statement_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statement_balance">
                    Statement Ending Balance
                  </Label>
                  <Input
                    id="statement_balance"
                    name="statement_balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">
                    Current Book Balance
                  </div>
                  <div
                    className={`text-xl font-bold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(account.balance)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Difference</div>
                  <div className="text-xl font-bold text-amber-600">
                    {formatCurrency(0)}{" "}
                    {/* This would be calculated dynamically */}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions to Reconcile */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions to Reconcile</CardTitle>
              <CardDescription>
                Check off the transactions that appear on your bank statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground w-10">
                          Match
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <Checkbox id={`transaction-${transaction.id}`} />
                          </td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No unreconciled transactions found for this account.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
                Reconciliation
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
}
