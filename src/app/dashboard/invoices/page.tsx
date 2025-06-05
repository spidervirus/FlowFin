"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import DashboardWrapper from "../dashboard-wrapper";

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [companyName, setCompanyName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Define the invoice interface
  interface Invoice {
    id: string;
    client: string;
    date: string;
    dueDate: string;
    amount: number;
    status: "paid" | "pending" | "overdue" | "draft";
  }

  // Empty invoices array with proper typing
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // Check if user is authenticated
        const supabaseClient = createClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // Get company settings
        const { data: settingsData, error } = await supabaseClient
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching company settings:", error);
        } else if (settingsData) {
          setSettings(settingsData);
          setCompanyName(settingsData.company_name || "");

          // Set currency from settings or default to USD
          if (settingsData.default_currency) {
            setCurrency(settingsData.default_currency as CurrencyCode);
          }
        }

        // Fetch invoices from the database
        const { data: invoicesData, error: invoicesError } =
          await supabaseClient
            .from("invoices")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (invoicesError) {
          console.error("Error fetching invoices:", invoicesError);
        } else {
          // Transform the data to match our Invoice interface
          const formattedInvoices: Invoice[] = (invoicesData || []).map(
            (invoice: any) => ({
              id: invoice.id,
              client: invoice.customer_name || invoice.customer_id || "Unknown Client",
              date: invoice.date,
              dueDate: invoice.due_date,
              amount: invoice.total_amount,
              status: invoice.status as
                | "paid"
                | "pending"
                | "overdue"
                | "draft",
            }),
          );

          setInvoices(formattedInvoices);
          setFilteredInvoices(formattedInvoices);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // Apply filters whenever search query, status filter, or date filter changes
  useEffect(() => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.client.toLowerCase().includes(query) ||
          invoice.id.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      switch (dateFilter) {
        case "this-month":
          filtered = filtered.filter((invoice) => {
            const invoiceDate = new Date(invoice.date);
            return (
              invoiceDate.getMonth() === currentMonth &&
              invoiceDate.getFullYear() === currentYear
            );
          });
          break;
        case "last-month":
          filtered = filtered.filter((invoice) => {
            const invoiceDate = new Date(invoice.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const yearOfLastMonth =
              currentMonth === 0 ? currentYear - 1 : currentYear;
            return (
              invoiceDate.getMonth() === lastMonth &&
              invoiceDate.getFullYear() === yearOfLastMonth
            );
          });
          break;
        case "this-quarter":
          const currentQuarter = Math.floor(currentMonth / 3);
          filtered = filtered.filter((invoice) => {
            const invoiceDate = new Date(invoice.date);
            const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3);
            return (
              invoiceQuarter === currentQuarter &&
              invoiceDate.getFullYear() === currentYear
            );
          });
          break;
        case "this-year":
          filtered = filtered.filter((invoice) => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate.getFullYear() === currentYear;
          });
          break;
      }
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits:
        CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
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

  if (loading) {
    return (
      <>
        <DashboardWrapper needsSetup={false}>
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-lg">Loading invoices...</p>
          </div>
        </DashboardWrapper>
      </>
    );
  }

  return (
    <>
      <DashboardWrapper needsSetup={false}>
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-muted-foreground">
                {companyName ? `${companyName} - ` : ""}Create and manage your
                client invoices
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
                value: formatCurrency(
                  filteredInvoices.reduce(
                    (sum, invoice) => sum + invoice.amount,
                    0,
                  ),
                ),
                subtitle: `${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? "s" : ""}`,
              },
              {
                title: "Paid",
                value: formatCurrency(
                  filteredInvoices
                    .filter((inv) => inv.status === "paid")
                    .reduce((sum, invoice) => sum + invoice.amount, 0),
                ),
                subtitle: `${filteredInvoices.filter((inv) => inv.status === "paid").length} invoice${filteredInvoices.filter((inv) => inv.status === "paid").length !== 1 ? "s" : ""}`,
                color: "text-green-600",
                onClick: () => setStatusFilter("paid"),
              },
              {
                title: "Pending",
                value: formatCurrency(
                  filteredInvoices
                    .filter((inv) => inv.status === "pending")
                    .reduce((sum, invoice) => sum + invoice.amount, 0),
                ),
                subtitle: `${filteredInvoices.filter((inv) => inv.status === "pending").length} invoice${filteredInvoices.filter((inv) => inv.status === "pending").length !== 1 ? "s" : ""}`,
                color: "text-yellow-600",
                onClick: () => setStatusFilter("pending"),
              },
              {
                title: "Overdue",
                value: formatCurrency(
                  filteredInvoices
                    .filter((inv) => inv.status === "overdue")
                    .reduce((sum, invoice) => sum + invoice.amount, 0),
                ),
                subtitle: `${filteredInvoices.filter((inv) => inv.status === "overdue").length} invoice${filteredInvoices.filter((inv) => inv.status === "overdue").length !== 1 ? "s" : ""}`,
                color: "text-red-600",
                onClick: () => setStatusFilter("overdue"),
              },
            ].map((card, index) => (
              <Card
                key={index}
                className={
                  card.onClick
                    ? "cursor-pointer hover:shadow-md transition-shadow"
                    : ""
                }
                onClick={card.onClick}
              >
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
                    <Input
                      placeholder="Search invoices..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select
                    value={dateFilter}
                    onValueChange={(value) => setDateFilter(value)}
                  >
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                >
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
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/invoices/${invoice.id}`)
                          }
                        >
                          <td className="py-3 px-4 font-medium">
                            {invoice.id.substring(0, 8)}
                          </td>
                          <td className="py-3 px-4">{invoice.client}</td>
                          <td className="py-3 px-4">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="py-3 px-4">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="py-3 px-4">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                invoice.status,
                              )}`}
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="View Invoice"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/invoices/${invoice.id}`,
                                  );
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Download Invoice"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // This would handle invoice download in a real implementation
                                  alert(
                                    "Download functionality would be implemented here",
                                  );
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                            <h3 className="text-lg font-medium mb-2">
                              No Invoices Found
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {searchQuery ||
                              statusFilter !== "all" ||
                              dateFilter !== "all"
                                ? "No invoices match your current filters. Try adjusting your search criteria."
                                : "You haven't created any invoices yet. Get started by creating your first invoice."}
                            </p>
                            {searchQuery ||
                            statusFilter !== "all" ||
                            dateFilter !== "all" ? (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSearchQuery("");
                                  setStatusFilter("all");
                                  setDateFilter("all");
                                }}
                              >
                                Clear Filters
                              </Button>
                            ) : (
                              <Link href="/dashboard/invoices/new">
                                <Button>
                                  <Plus className="mr-2 h-4 w-4" /> Create
                                  Invoice
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardWrapper>
    </>
  );
}
