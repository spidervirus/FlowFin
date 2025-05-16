"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Search,
  SortAsc,
  Pencil,
  Download,
  MoreHorizontal,
  Eye,
  Trash2,
  CreditCard,
  Printer,
  Share,
  Mail,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Simplified Invoice interface for now
interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string; // Consider using specific enum later
  date: string;
  due_date: string;
  customer_id: string;
  user_id: string;
  customers: { // Added to hold customer data
    company_name: string | null;
  } | null;
}

const INVOICE_TABS = [
  { id: "all", label: "All Invoices" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
  { id: "cancelled", label: "Cancelled" },
] as const;

type InvoiceTabId = typeof INVOICE_TABS[number]["id"];

async function fetchData(searchTerm: string, currentTab: InvoiceTabId, userId: string): Promise<Invoice[]> {
  console.log(`[InvoicesPage DEBUG] fetchData called. Tab: ${currentTab}, User: ${userId}, Search: '${searchTerm}'`);
  const supabase = createClient();
  let query = supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, date, due_date, customer_id, user_id, customers ( company_name )")
    .eq("user_id", userId);

  if (currentTab !== "all") {
    query = query.eq("status", currentTab);
  }

  if (searchTerm) {
    // Only search by invoice_number for now
    query = query.ilike("invoice_number", `%${searchTerm}%`);
  }
  
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error || !data) {
    console.error("[InvoicesPage DEBUG] fetchData error:", error);
    toast.error("Error fetching invoices: " + (error?.message || "Unknown error"));
    return [];
  }

  console.log("[InvoicesPage DEBUG] fetchData success. Raw count:", data.length);
  return data as Invoice[];
}

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<InvoiceTabId>("all");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function getInitialData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch company settings for currency
        const { data: settings } = await supabase
          .from("company_settings")
          .select("default_currency")
          .eq("user_id", user.id)
          .single();
        if (settings?.default_currency) {
          setCurrency(settings.default_currency as CurrencyCode);
        }
        // Fetch initial invoices
        const fetchedInvoices = await fetchData(searchTerm, currentTab, user.id);
        setInvoices(fetchedInvoices);
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    }
    getInitialData();
  }, [currentTab, router]); // Removed searchTerm from dependency array to avoid re-fetching on every keystroke

  const handleSearch = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const fetchedInvoices = await fetchData(searchTerm, currentTab, user.id);
      setInvoices(fetchedInvoices);
    }
    setLoading(false);
  };

  const filteredInvoices = invoices; // Filtering is now done in fetchData
  console.log("[InvoicesPage DEBUG] Filtered Invoices:", filteredInvoices);

  const calculateTotals = (invList: Invoice[]) => {
    let totalRevenue = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;

    invList.forEach((invoice) => {
      const amount = typeof invoice.total_amount === 'number' ? invoice.total_amount : 0;
      if (invoice.status === "paid") {
        totalRevenue += amount;
      } else if (invoice.status !== "cancelled" && invoice.status !== "draft") {
        outstandingAmount += amount;
        if (invoice.status === "overdue") {
          overdueAmount += amount;
        }
      }
    });
    return { totalRevenue, outstandingAmount, overdueAmount };
  };

  const totals = calculateTotals(filteredInvoices);

  const formatCurrencyDisplay = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDateDisplay = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, "MMM d, yyyy");
      }
    } catch (e) {
      // if parseISO fails, try direct formatting if it's already in a good format
      try {
        return format(new Date(dateString), "MMM d, yyyy");
      } catch (e2) { /* ignore */ }
    }
    return dateString; // Fallback to original string if all parsing/formatting fails
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-200 text-gray-900";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-3 w-3" />;
      case "sent": return <Mail className="h-3 w-3" />;
      case "overdue": return <AlertCircle className="h-3 w-3" />;
      case "draft": return <FileText className="h-3 w-3" />;
      case "cancelled": return <XCircle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  if (loading && invoices.length === 0) { // Show loader only if no invoices are displayed yet
    return (
      <DashboardShell>
        <DashboardHeader heading="Invoices" text="Manage your invoices." />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    );
  }
  
  return (
    <DashboardShell>
      <DashboardHeader heading="Invoices" text="Manage your invoices.">
        <Link href="/dashboard/sales/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue (Paid)</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrencyDisplay(totals.totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Amount</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrencyDisplay(totals.outstandingAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue Amount</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrencyDisplay(totals.overdueAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              View and manage all your invoices.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Input
              placeholder="Search by invoice #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2"/>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value as InvoiceTabId)}
            className="mb-4"
          >
            <TabsList>
              {INVOICE_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading && <p className="text-center py-4">Loading invoices...</p>}
          {!loading && filteredInvoices.length === 0 && (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No invoices found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {currentTab === "all" && !searchTerm 
                  ? "Get started by creating a new invoice."
                  : `No invoices match your current filter${searchTerm ? " and search query" : ""}.`}
              </p>
              {currentTab === "all" && !searchTerm && (
                 <Link href="/dashboard/sales/invoices/new" className="mt-6">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                 </Link>
              )}
            </div>
          )}

          {!loading && filteredInvoices.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Customer / Invoice #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {/* Customer Name would go here if fetched */}
                                {invoice.customers?.company_name || invoice.customer_id} 
                              </span>
                              <span className="text-sm text-muted-foreground">
                                #{invoice.invoice_number}
                              </span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <p className="text-sm text-muted-foreground">
                              Customer ID: {invoice.customer_id}
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>{formatCurrencyDisplay(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(invoice.status)} text-xs`}
                        >
                          <span className="flex items-center">
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">
                              {invoice.status}
                            </span>
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateDisplay(invoice.date)}</TableCell>
                      <TableCell>{formatDateDisplay(invoice.due_date)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/sales/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/sales/invoices/${invoice.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log("Download PDF for", invoice.id)}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log("Send invoice", invoice.id)}
                            >
                              <Mail className="mr-2 h-4 w-4" /> Send Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 hover:!text-red-600 hover:!bg-red-50"
                              onClick={() => console.log("Delete invoice", invoice.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
