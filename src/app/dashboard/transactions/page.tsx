import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import RecurringTransactions from "@/components/transaction-components/recurring-transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch real transactions from the database
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*, category:category_id(id, name, type, color)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
  }

  // Fetch recurring transactions
  const { data: recurringTransactions, error: recurringError } = await supabase
    .from("transactions")
    .select("*, category:category_id(id, name, type, color)")
    .eq("user_id", user.id)
    .eq("is_recurring", true)
    .order("next_occurrence_date", { ascending: true });

  if (recurringError) {
    console.error("Error fetching recurring transactions:", recurringError);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
            <div>
              <h1 className="text-3xl font-bold">Transactions</h1>
              <p className="text-muted-foreground">
                Manage and track your financial transactions
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/transactions/import">
                <Button variant="outline">
                  <ArrowDownLeft className="mr-2 h-4 w-4" /> Import
                </Button>
              </Link>
              <Link href="/dashboard/transactions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </Link>
            </div>
          </header>

          {/* Tabs for All Transactions and Recurring */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-8 mt-6">
              {/* Filters Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search transactions..."
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="payroll">Payroll</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    A list of all your recent transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                            Category
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
                        {transactions?.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div
                                  className={`mr-3 p-1.5 rounded-full ${
                                    transaction.type === "income"
                                      ? "bg-green-100"
                                      : transaction.type === "expense"
                                      ? "bg-red-100"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {transaction.type === "income" ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                  ) : transaction.type === "expense" ? (
                                    <ArrowDownLeft className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                                {transaction.description}
                                {transaction.is_recurring && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    Recurring
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {transaction.category?.name || "Uncategorized"}
                            </td>
                            <td
                              className={`py-3 px-4 font-medium ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : transaction.type === "expense"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {transaction.type === "income"
                                ? "+"
                                : transaction.type === "expense"
                                ? "-"
                                : ""}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recurring" className="mt-6">
              <RecurringTransactions transactions={recurringTransactions || []} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
