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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, FileText, PieChart } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Financial Reports</h1>
              <p className="text-muted-foreground">
                Generate and analyze your business financial reports
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </header>

          {/* Report Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select defaultValue="profit-loss">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Report" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                      <SelectItem value="balance-sheet">
                        Balance Sheet
                      </SelectItem>
                      <SelectItem value="cash-flow">Cash Flow</SelectItem>
                      <SelectItem value="tax-summary">Tax Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select defaultValue="this-year">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="last-quarter">Last Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Comparison</label>
                  <Select defaultValue="previous-period">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Comparison" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="previous-period">
                        Previous Period
                      </SelectItem>
                      <SelectItem value="previous-year">
                        Previous Year
                      </SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="mt-auto">Generate Report</Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Revenue",
                    value: "$124,500.00",
                    change: "+12.5%",
                    changeType: "positive",
                  },
                  {
                    title: "Total Expenses",
                    value: "$98,200.00",
                    change: "+8.2%",
                    changeType: "negative",
                  },
                  {
                    title: "Net Profit",
                    value: "$26,300.00",
                    change: "+15.3%",
                    changeType: "positive",
                  },
                  {
                    title: "Profit Margin",
                    value: "21.1%",
                    change: "+2.4%",
                    changeType: "positive",
                  },
                ].map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {metric.value}
                      </div>
                      <div
                        className={`text-sm mt-1 ${metric.changeType === "positive" ? "text-green-600" : "text-red-600"}`}
                      >
                        {metric.change} from previous period
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Profit & Loss Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss Summary</CardTitle>
                  <CardDescription>Financial year 2023</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Category
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                            Current Period
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                            Previous Period
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b font-medium">
                          <td className="py-3 px-4">Income</td>
                          <td className="py-3 px-4 text-right">$124,500.00</td>
                          <td className="py-3 px-4 text-right">$110,600.00</td>
                          <td className="py-3 px-4 text-right text-green-600">
                            +12.5%
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 pl-8">Sales Revenue</td>
                          <td className="py-3 px-4 text-right">$115,000.00</td>
                          <td className="py-3 px-4 text-right">$102,500.00</td>
                          <td className="py-3 px-4 text-right text-green-600">
                            +12.2%
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 pl-8">Service Revenue</td>
                          <td className="py-3 px-4 text-right">$9,500.00</td>
                          <td className="py-3 px-4 text-right">$8,100.00</td>
                          <td className="py-3 px-4 text-right text-green-600">
                            +17.3%
                          </td>
                        </tr>
                        <tr className="border-b font-medium">
                          <td className="py-3 px-4">Expenses</td>
                          <td className="py-3 px-4 text-right">$98,200.00</td>
                          <td className="py-3 px-4 text-right">$90,800.00</td>
                          <td className="py-3 px-4 text-right text-red-600">
                            +8.2%
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 pl-8">Payroll</td>
                          <td className="py-3 px-4 text-right">$58,500.00</td>
                          <td className="py-3 px-4 text-right">$54,200.00</td>
                          <td className="py-3 px-4 text-right text-red-600">
                            +7.9%
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 pl-8">Rent & Utilities</td>
                          <td className="py-3 px-4 text-right">$12,800.00</td>
                          <td className="py-3 px-4 text-right">$12,000.00</td>
                          <td className="py-3 px-4 text-right text-red-600">
                            +6.7%
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 pl-8">Marketing</td>
                          <td className="py-3 px-4 text-right">$15,400.00</td>
                          <td className="py-3 px-4 text-right">$14,200.00</td>
                          <td className="py-3 px-4 text-right text-red-600">
                            +8.5%
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 pl-8">
                            Software & Subscriptions
                          </td>
                          <td className="py-3 px-4 text-right">$11,500.00</td>
                          <td className="py-3 px-4 text-right">$10,400.00</td>
                          <td className="py-3 px-4 text-right text-red-600">
                            +10.6%
                          </td>
                        </tr>
                        <tr className="border-b font-medium text-lg">
                          <td className="py-4 px-4">Net Profit</td>
                          <td className="py-4 px-4 text-right">$26,300.00</td>
                          <td className="py-4 px-4 text-right">$19,800.00</td>
                          <td className="py-4 px-4 text-right text-green-600">
                            +32.8%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Income Statement</CardTitle>
                  <CardDescription>
                    Breakdown of all income and expense categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Detailed report data would appear here
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This would include a comprehensive breakdown of all income
                      and expense categories with monthly comparisons.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                    <CardDescription>
                      Distribution of income sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Revenue chart would appear here
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Visual representation of revenue distribution across
                        different categories.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>
                      Distribution of expense categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Expense chart would appear here
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Visual breakdown of where your business money is being
                        spent.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Profit Trend</CardTitle>
                    <CardDescription>
                      Net profit over the last 12 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Profit trend chart would appear here
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Monthly comparison of revenue, expenses and resulting
                        profit over time.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Trends Analysis</CardTitle>
                  <CardDescription>
                    Long-term financial performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Trend analysis would appear here
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Comprehensive analysis of your business financial trends,
                      growth rates, and projections.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
