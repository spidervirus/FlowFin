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
import { Download, FileText, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Sample invoices data
  const invoices = [
    {
      id: "INV-001",
      client: "ABC Corporation",
      date: "2023-06-15",
      dueDate: "2023-07-15",
      amount: 2500,
      status: "paid",
    },
    {
      id: "INV-002",
      client: "XYZ Ltd",
      date: "2023-06-10",
      dueDate: "2023-07-10",
      amount: 1800,
      status: "paid",
    },
    {
      id: "INV-003",
      client: "Acme Inc",
      date: "2023-06-05",
      dueDate: "2023-07-05",
      amount: 3200,
      status: "pending",
    },
    {
      id: "INV-004",
      client: "Global Solutions",
      date: "2023-05-28",
      dueDate: "2023-06-28",
      amount: 4500,
      status: "overdue",
    },
    {
      id: "INV-005",
      client: "Tech Innovators",
      date: "2023-05-20",
      dueDate: "2023-06-20",
      amount: 1250,
      status: "draft",
    },
    {
      id: "INV-006",
      client: "Creative Studios",
      date: "2023-05-15",
      dueDate: "2023-06-15",
      amount: 3750,
      status: "overdue",
    },
    {
      id: "INV-007",
      client: "DEF Enterprises",
      date: "2023-05-10",
      dueDate: "2023-06-10",
      amount: 2800,
      status: "paid",
    },
    {
      id: "INV-008",
      client: "Bright Solutions",
      date: "2023-05-05",
      dueDate: "2023-06-05",
      amount: 1950,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-muted-foreground">
                Create and manage your client invoices
              </p>
            </div>
            <Link href="/dashboard/invoices/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </Link>
          </header>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: "Total Invoices",
                value: "$16,750.00",
                subtitle: "8 invoices",
              },
              {
                title: "Paid",
                value: "$7,100.00",
                subtitle: "3 invoices",
                color: "text-green-600",
              },
              {
                title: "Pending",
                value: "$5,150.00",
                subtitle: "2 invoices",
                color: "text-yellow-600",
              },
              {
                title: "Overdue",
                value: "$8,250.00",
                subtitle: "2 invoices",
                color: "text-red-600",
              },
            ].map((card, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </div>
                  <div
                    className={`text-2xl font-bold mt-2 ${card.color || ""}`}
                  >
                    {card.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {card.subtitle}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search invoices..." className="pl-10" />
                  </div>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>
                Manage and track your client invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Invoice #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Client
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Issue Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                      >
                        <td className="py-3 px-4 font-medium">{invoice.id}</td>
                        <td className="py-3 px-4">{invoice.client}</td>
                        <td className="py-3 px-4">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}
                          >
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
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
