"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/database.types";
import { PaymentWithInvoice, PAYMENT_METHODS } from "@/types/payments";
import DashboardWrapper from "../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, Plus, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/dialogs/RecordPaymentDialog";
import { generatePaymentReceipt, downloadReceipt } from "@/lib/utils/receipt";
import { CurrencyCode } from "@/types/currency";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>("USD");

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: settings, error: settingsError } = await supabase
        .from("company_settings")
        .select("default_currency")
        .single();

      if (settingsError) {
        console.error("Error fetching company settings:", settingsError);
      } else if (settings?.default_currency) {
        setDefaultCurrency(settings.default_currency as CurrencyCode);
      }

      const { data, error } = await supabase
        .from("invoice_payments")
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            client_name,
            total_amount,
            currency_code
          ),
          transaction:transactions (
            id,
            reference
          )
        `)
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;

      const typedPayments = (data || []).map(p => {
        // Check if p.invoice is a valid object and not a Supabase error/empty relation
        const mappedInvoice = (p.invoice && typeof p.invoice === 'object' && (p.invoice as any).invoice_number !== undefined)
          ? {
              invoice_number: (p.invoice as any).invoice_number as string | null,
              client_name: (p.invoice as any).client_name as string | null,
              total_amount: (p.invoice as any).total_amount as number | null,
              currency_code: (p.invoice as any).currency_code as CurrencyCode | null,
            }
          : null;

        // Check if p.transaction is a valid object
        const mappedTransaction = (p.transaction && typeof p.transaction === 'object' && (p.transaction as any).id !== undefined)
          ? {
              id: (p.transaction as any).id as string,
              reference: (p.transaction as any).reference as string | null,
            }
          : null;

        return {
          ...p,
          currency_code: mappedInvoice?.currency_code || defaultCurrency,
          invoice: mappedInvoice,
          transaction: mappedTransaction,
        };
      }) as PaymentWithInvoice[];

      setPayments(typedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesMethod = filterMethod === "all" || payment.payment_method === filterMethod;
    const matchesSearch = searchQuery === "" || 
      payment.invoice?.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateRange.start || !dateRange.end || 
      (payment.payment_date >= dateRange.start && payment.payment_date <= dateRange.end);
    
    return matchesMethod && matchesSearch && matchesDate;
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const handleExport = () => {
    // TODO: Implement CSV export
    toast.info("Export functionality coming soon");
  };

  const handleGenerateReceipt = async (payment: PaymentWithInvoice) => {
    try {
      const { data: organization } = await supabase
        .from("organizations")
        .select("*")
        .single();

      if (!organization) {
        throw new Error("Organization not found");
      }

      const companyInfo = {
        name: organization.name,
        address: (organization as any).address || "",
        phone: (organization as any).phone || "",
        email: (organization as any).email || "",
        website: (organization as any).website || "",
        taxId: (organization as any).tax_id || "",
      };

      const blob = await generatePaymentReceipt(payment, companyInfo);
      downloadReceipt(
        blob,
        `receipt-${payment.invoice?.invoice_number || payment.id}.pdf`
      );
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt");
    }
  };

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Payments Received</h1>
            <p className="text-muted-foreground">
              Track and manage all received payments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter and search through payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search by client or invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Select
                  value={filterMethod}
                  onValueChange={setFilterMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Payments
                </p>
                <p className="text-2xl font-bold">
                  {filteredPayments.length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalAmount, defaultCurrency)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Most Common Method
                </p>
                <p className="text-2xl font-bold capitalize">
                  {payments.length > 0
                    ? Object.entries(
                        payments.reduce((acc, payment) => {
                          acc[payment.payment_method] =
                            (acc[payment.payment_method] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).sort((a, b) => b[1] - a[1])[0][0].replace("_", " ")
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View and manage all payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {payment.invoice?.invoice_number || "N/A"}
                      </TableCell>
                      <TableCell>
                        {payment.invoice?.client_name || "N/A"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount, payment.currency_code || defaultCurrency)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Reconciled
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.transaction?.reference || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateReceipt(payment)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <RecordPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onSuccess={fetchPayments}
          defaultValues={{
            currency_code: defaultCurrency
          }}
        />
      </div>
    </DashboardWrapper>
  );
} 