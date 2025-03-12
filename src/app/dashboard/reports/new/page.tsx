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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, BarChart3, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: { account?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch accounts for the dropdown
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name");

  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .order("name");

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/reports">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Generate Report</h1>
                <p className="text-muted-foreground">
                  Create a custom financial report
                </p>
              </div>
            </div>
          </header>

          {/* Report Form */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Select the type of report and customize the parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/api/reports" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Monthly Income Statement"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Report Type</Label>
                    <Select name="type" required>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income_statement">
                          Income Statement
                        </SelectItem>
                        <SelectItem value="balance_sheet">
                          Balance Sheet
                        </SelectItem>
                        <SelectItem value="cash_flow">
                          Cash Flow Statement
                        </SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_range">Date Range</Label>
                    <Select name="date_range" defaultValue="this_month">
                      <SelectTrigger id="date_range">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="this_quarter">
                          This Quarter
                        </SelectItem>
                        <SelectItem value="last_quarter">
                          Last Quarter
                        </SelectItem>
                        <SelectItem value="this_year">This Year</SelectItem>
                        <SelectItem value="last_year">Last Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      defaultValue={
                        new Date(new Date().setMonth(new Date().getMonth() - 1))
                          .toISOString()
                          .split("T")[0]
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="accounts">Accounts to Include</Label>
                    <Select
                      name="accounts"
                      defaultValue={searchParams.account || "all"}
                    >
                      <SelectTrigger id="accounts">
                        <SelectValue placeholder="Select accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="income_categories">Income Categories</Label>
                    <Select name="income_categories" defaultValue="all">
                      <SelectTrigger id="income_categories">
                        <SelectValue placeholder="Select categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Income Categories
                        </SelectItem>
                        {categories
                          ?.filter((c) => c.type === "income")
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense_categories">
                      Expense Categories
                    </Label>
                    <Select name="expense_categories" defaultValue="all">
                      <SelectTrigger id="expense_categories">
                        <SelectValue placeholder="Select categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Expense Categories
                        </SelectItem>
                        {categories
                          ?.filter((c) => c.type === "expense")
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Link href="/dashboard/reports">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit">
                    <BarChart3 className="mr-2 h-4 w-4" /> Generate Report
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
