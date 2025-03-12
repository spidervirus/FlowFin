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

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Sample transactions data
  const transactions = [
    {
      id: "1",
      date: "2023-06-15",
      description: "Client Payment - ABC Corp",
      category: "Sales",
      amount: 2500,
      type: "income",
      status: "completed",
    },
    {
      id: "2",
      date: "2023-06-14",
      description: "Office Supplies",
      category: "Office",
      amount: 125.5,
      type: "expense",
      status: "completed",
    },
    {
      id: "3",
      date: "2023-06-13",
      description: "Software Subscription",
      category: "Software",
      amount: 49.99,
      type: "expense",
      status: "completed",
    },
    {
      id: "4",
      date: "2023-06-12",
      description: "Client Payment - XYZ Ltd",
      category: "Sales",
      amount: 1800,
      type: "income",
      status: "completed",
    },
    {
      id: "5",
      date: "2023-06-10",
      description: "Utility Bill",
      category: "Utilities",
      amount: 210.75,
      type: "expense",
      status: "pending",
    },
    {
      id: "6",
      date: "2023-06-08",
      description: "Marketing Campaign",
      category: "Marketing",
      amount: 500,
      type: "expense",
      status: "completed",
    },
    {
      id: "7",
      date: "2023-06-05",
      description: "Client Retainer - DEF Inc",
      category: "Sales",
      amount: 3000,
      type: "income",
      status: "completed",
    },
    {
      id: "8",
      date: "2023-06-03",
      description: "Office Rent",
      category: "Rent",
      amount: 1500,
      type: "expense",
      status: "completed",
    },
    {
      id: "9",
      date: "2023-06-01",
      description: "Employee Salary",
      category: "Payroll",
      amount: 4500,
      type: "expense",
      status: "completed",
    },
    {
      id: "10",
      date: "2023-05-28",
      description: "Client Project - GHI Corp",
      category: "Sales",
      amount: 5000,
      type: "income",
      status: "pending",
    },
  ];

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
            <Link href="/dashboard/transactions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </Link>
          </header>

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
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                            >
                              {transaction.type === "income" ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <span>{transaction.description}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100">
                            {transaction.category}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "income" ? "+" : "-"}{" "}
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${transaction.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {transaction.status === "completed"
                              ? "Completed"
                              : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
