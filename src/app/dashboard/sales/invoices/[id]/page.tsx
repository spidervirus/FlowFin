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
import { ArrowLeft, Download, Pencil, Check, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import DashboardWrapper from "../../../dashboard-wrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateInvoicePDF, downloadPDF, CompanyInfo } from '@/lib/utils/pdf';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Invoice } from '@/types/invoices';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

type InvoiceDetails = Database["public"]["Tables"]["invoices"]["Row"];
type FetchedInvoiceItem = Omit<Database["public"]["Tables"]["invoice_items"]["Row"], 'created_at' | 'updated_at'> & {
  created_at: string | null; // Allow null
  updated_at: string | null; // Allow null
};
type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];

// Adjusted Customer type for what we select from the join
type JoinedCustomer = {
  id: string;
  company_name: string | null;
  email: string | null;
  billing_address_line1: string | null;
  // Add other fields if your Customer type or usage requires them
};

// Explicit type for invoice with joined customer data
type InvoiceWithCustomer = InvoiceDetails & { customer_details: JoinedCustomer | null };

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceWithCustomer | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<FetchedInvoiceItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoiceData() {
      setLoading(true);
      setError(null);
      const supabaseClient = createClient();

      try {
        if (!invoiceId) {
          throw new Error("Invoice ID is missing");
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        console.log("[DETAIL PAGE DEBUG] Attempting to fetch company settings for user:", user.id);
        const { data: settingsData, error: settingsError } = await supabaseClient
          .from("company_settings")
          .select("default_currency, company_name")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
            console.warn("[DETAIL PAGE DEBUG] Supabase error fetching company settings:", settingsError.message);
            // Not setting currency, will use default or previous state
        } else if (settingsData) {
          console.log("[DETAIL PAGE DEBUG] Successfully fetched company settings:", settingsData);
          if (settingsData.default_currency) {
            setCurrency(settingsData.default_currency as CurrencyCode);
            console.log("[DETAIL PAGE DEBUG] Currency state UPDATED to:", settingsData.default_currency);
          } else {
            console.log("[DETAIL PAGE DEBUG] Company settings fetched, but 'default_currency' is null or empty. Currency state remains:", currency);
          }
        } else {
          console.log("[DETAIL PAGE DEBUG] No company settings data returned for user. Currency state remains:", currency);
        }

        const { data: fetchedInvoiceData, error: invoiceFetchingError } = await supabaseClient
          .from("invoices")
          // Adjust the select for the customers join with an alias
          .select("*, customer_details:customers (id, company_name, email, billing_address_line1)") 
          .eq("id", invoiceId)
          .eq("user_id", user.id)
          .single();

        if (invoiceFetchingError) {
          console.error("[DETAIL PAGE DEBUG] Error fetching invoice:", invoiceFetchingError);
          setError("Could not find the requested invoice: " + invoiceFetchingError.message);
          return;
        }

        if (fetchedInvoiceData) {
          setInvoice(fetchedInvoiceData as InvoiceWithCustomer);

          const { data: fetchedItemsData, error: itemsFetchingError } = await supabaseClient
            .from("invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId);

          if (itemsFetchingError) {
            console.error("[DETAIL PAGE DEBUG] Error fetching invoice items:", itemsFetchingError);
            setError("Could not load invoice items: " + itemsFetchingError.message);
            setInvoiceItems([]);
          } else {
            setInvoiceItems(fetchedItemsData || []);
          }
        } else {
          setError("Invoice not found");
        }
      } catch (err) {
        const e = err as Error;
        console.error("[DETAIL PAGE DEBUG] Error loading invoice page data:", e);
        setError("An error occurred while loading the invoice: " + e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoiceData();
  }, [invoiceId, router]);

  const updateInvoiceStatus = async (newStatus: InvoiceDetails["status"]) => {
    if (!invoice) return;

    setUpdating(true);
    try {
      const supabaseClient = createClient();
      const currentDate = new Date().toISOString();

      // Prepare data for invoice update
      let invoiceUpdateData: Partial<InvoiceDetails> & { payment_date?: string | null } = {
        status: newStatus,
      };
      if (newStatus === "paid") {
        invoiceUpdateData.payment_date = currentDate.split("T")[0]; // Set payment_date to today
      }

      const { error: updateError } = await supabaseClient
        .from("invoices")
        .update(invoiceUpdateData)
        .eq("id", invoice.id)
        .eq("user_id", invoice.user_id); // Ensure user_id matches for security

      if (updateError) {
        console.error("[DETAIL PAGE DEBUG] Error updating invoice status:", updateError);
        toast.error("Failed to update invoice status: " + updateError.message);
        setUpdating(false); // Ensure saving state is reset
        return;
      }

      // If status changed to 'paid', create a corresponding transaction
      if (newStatus === "paid" && invoice.total_amount > 0) {
        const transactionData = {
          user_id: invoice.user_id,
          date: currentDate.split("T")[0],
          description: `Payment for Invoice #${invoice.invoice_number}`,
          amount: invoice.total_amount,
          type: "income" as "income" | "expense" | "transfer",
          // IMPORTANT: Replace with actual IDs from your database
          category_id: "YOUR_SALES_REVENUE_CATEGORY_ID", // e.g., ID of "Sales Revenue" category
          account_id: "YOUR_DEFAULT_ACCOUNT_ID_FOR_INCOME", // e.g., ID of your main business bank account
          status: "completed" as "pending" | "completed" | "reconciled",
          notes: `Invoice ID: ${invoice.id}`, // Optional: store invoice ID in notes if no direct FK
        };

        console.log("[DETAIL PAGE DEBUG] Creating transaction for paid invoice:", transactionData);

        const { error: transactionError } = await supabaseClient
          .from("transactions")
          .insert(transactionData);

        if (transactionError) {
          console.error("[DETAIL PAGE DEBUG] Error creating transaction for paid invoice:", transactionError);
          // Potentially roll back invoice status update or notify user of partial success
          toast.error("Invoice status updated, but failed to create payment transaction: " + transactionError.message);
        } else {
          console.log("[DETAIL PAGE DEBUG] Transaction created successfully for paid invoice.");
        }
      }

      setInvoice(prevInvoice => prevInvoice ? { ...prevInvoice, ...invoiceUpdateData } : null);
      toast.success(`Invoice status updated to ${newStatus}`);
      router.refresh(); // Refresh server-side data
    } catch (err) {
      const e = err as Error;
      console.error("[DETAIL PAGE DEBUG] Error updating status or creating transaction:", e);
      toast.error("An error occurred: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

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
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !invoice.customer_details || invoiceItems.length === 0) {
      toast.error("Invoice data is not fully loaded for PDF generation.");
      return;
    }

    try {
      const supabaseClient = createClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("User not authenticated for PDF generation");

      const { data: companyData, error: companySettingsError } = await supabaseClient
        .from("company_settings")
        .select("company_name, address, phone_number")
        .eq("user_id", user.id)
        .single();

      if (companySettingsError || !companyData) {
        console.error("[DETAIL PAGE DEBUG] PDF: Company settings not found or error:", companySettingsError);
        toast.error("Company information for PDF could not be loaded.");
        return;
      }

      const companyInfoForPDF: CompanyInfo = {
        name: companyData.company_name || "Your Company Name",
        address: companyData.address || "Company Address",
        phone: companyData.phone_number || "Company Phone",
        email: user.email || "user@example.com",
      };

      const invoiceForPdf = {
        ...invoice,
        items: invoiceItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })),
        client_name: invoice.customer_details?.company_name || "N/A",
        client_email: invoice.customer_details?.email || "N/A",
        client_address: invoice.customer_details?.billing_address_line1 || "N/A",
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        total_amount: invoice.total_amount,
      };

      const blob = await generateInvoicePDF(invoiceForPdf as any, companyInfoForPDF);
      downloadPDF(blob, `invoice-${invoice.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading invoice...</p>
        </div>
      </DashboardWrapper>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-2">Error</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500">{error || "Invoice not found"}</p>
              <Link href="/dashboard/invoices">
                <Button className="mt-4">Return to Invoices</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardWrapper>
    );
  }

  console.log("[DETAIL PAGE DEBUG] Final currency state before render:", currency);

  return (
    <DashboardWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/sales/invoices">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            Invoice #{invoice?.invoice_number}
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/sales/invoices/${invoiceId}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            {invoice && invoice.status && invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Change Status</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {invoice.status !== "sent" && (
                    <DropdownMenuItem onClick={() => updateInvoiceStatus("sent")}>
                      Mark as Sent
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => updateInvoiceStatus("paid")}>
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateInvoiceStatus("cancelled")}>
                    Mark as Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Customer</Label>
              <p className="font-medium">{invoice?.customer_details?.company_name || "N/A"}</p>
              <p className="text-sm text-muted-foreground">
                {invoice?.customer_details?.email || "No email"}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice?.customer_details?.billing_address_line1 || "No address"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Invoice Number</Label>
              <p className="font-medium">{invoice?.invoice_number}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Invoice Date</Label>
              <p className="font-medium">
                {invoice?.date ? formatDate(invoice.date) : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Due Date</Label>
              <p className="font-medium">
                {invoice?.due_date ? formatDate(invoice.due_date) : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  invoice?.status || "draft",
                )}`}
              >
                {invoice?.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceItems.length === 0 ? (
              <p className="text-muted-foreground">No items on this invoice.</p>
            ) : (
              <div className="space-y-4">
                {invoiceItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 items-center p-2 border-b last:border-b-0"
                  >
                    <div className="col-span-5">
                      <p className="font-medium">{item.description}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p>{item.quantity}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p>{formatCurrency(item.unit_price)}</p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className="font-medium">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 items-center pt-4 mt-4 border-t">
                  <div className="col-span-9 text-right font-semibold">Subtotal</div>
                  <div className="col-span-3 text-right font-semibold">
                    {formatCurrency(invoice?.subtotal || 0)}
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-9 text-right">Tax ({invoice?.tax_rate || 0}%)</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(invoice?.tax_amount || 0)}
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center text-lg font-bold border-t pt-4 mt-2">
                  <div className="col-span-9 text-right">Total</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(invoice?.total_amount || 0)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section - Corrected Structure */}
        {(invoice?.notes || invoice?.delivery_tracking_id || invoice?.shipping_address) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice?.notes && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1 text-sm">Notes:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice?.delivery_tracking_id && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1 text-sm">Delivery Tracking ID:</h4>
                  <p className="text-sm text-muted-foreground">{invoice.delivery_tracking_id}</p>
                </div>
              )}
              {invoice?.shipping_address && (
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Shipping Address:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.shipping_address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardWrapper>
  );
}
