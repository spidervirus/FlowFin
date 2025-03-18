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
import { createClient } from '@/lib/supabase/client';
import DashboardWrapper from "../../dashboard-wrapper";
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

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceDetails {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  client_name: string;
  client_email: string;
  client_address: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  notes?: string;
  payment_terms?: string;
  created_at: string;
  user_id: string;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      
      try {
        if (!invoiceId) {
          throw new Error('Invoice ID is missing');
        }
        
        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/sign-in');
          return;
        }
        
        // Get company settings for currency
        const { data: settingsData } = await supabaseClient
          .from('company_settings')
          .select('default_currency')
          .eq('user_id', user.id)
          .single();
          
        if (settingsData?.default_currency) {
          setCurrency(settingsData.default_currency as CurrencyCode);
        }
        
        // Get invoice details
        const { data: invoiceData, error: invoiceError } = await supabaseClient
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .eq('user_id', user.id)
          .single();
          
        if (invoiceError) {
          console.error('Error fetching invoice:', invoiceError);
          setError('Could not find the requested invoice');
          return;
        }
        
        if (invoiceData) {
          // Parse JSON items if stored as string
          if (typeof invoiceData.items === 'string') {
            invoiceData.items = JSON.parse(invoiceData.items);
          }
          
          setInvoice(invoiceData as InvoiceDetails);
        } else {
          setError('Invoice not found');
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        setError('An error occurred while loading the invoice');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvoice();
  }, [invoiceId, router]);

  const updateInvoiceStatus = async (newStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled', paymentDate?: string) => {
    if (!invoice) return;
    
    setUpdating(true);
    try {
      const supabaseClient = createClient();
      
      const updateData: { 
        status: string;
        payment_date?: string | null;
      } = { status: newStatus };
      
      if (newStatus === 'paid' && paymentDate) {
        updateData.payment_date = paymentDate;
      } else if (newStatus !== 'paid') {
        // Clear payment date if status is not paid
        updateData.payment_date = null;
      }
      
      const { error } = await supabaseClient
        .from('invoices')
        .update(updateData)
        .eq('id', invoice.id)
        .eq('user_id', invoice.user_id);
        
      if (error) {
        console.error('Error updating invoice status:', error);
        toast.error('Failed to update invoice status');
        return;
      }
      
      // Update local state
      setInvoice({
        ...invoice,
        status: newStatus,
        payment_date: newStatus === 'paid' ? paymentDate : undefined
      });
      
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred while updating the status');
    } finally {
      setUpdating(false);
      setShowPaymentDialog(false);
    }
  };

  const handleMarkAsPaid = () => {
    setShowPaymentDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || 'en-US', {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
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
              <p className="text-red-500">{error || 'Invoice not found'}</p>
              <Link href="/dashboard/invoices">
                <Button className="mt-4">Return to Invoices</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold ml-2">Invoice #{invoice.invoice_number}</h1>
              <p className="text-muted-foreground ml-2">
                {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={updating}>
                  <span
                    className={`inline-block w-3 h-3 mr-2 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-500' :
                      invoice.status === 'sent' ? 'bg-yellow-500' :
                      invoice.status === 'overdue' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}
                  ></span>
                  {updating ? 'Updating...' : `Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => updateInvoiceStatus('draft')}
                  className="cursor-pointer"
                  disabled={invoice.status === 'draft'}
                >
                  {invoice.status === 'draft' && <Check className="mr-2 h-4 w-4" />}
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateInvoiceStatus('sent')}
                  className="cursor-pointer"
                  disabled={invoice.status === 'sent'}
                >
                  {invoice.status === 'sent' && <Check className="mr-2 h-4 w-4" />}
                  Sent
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleMarkAsPaid}
                  className="cursor-pointer"
                  disabled={invoice.status === 'paid'}
                >
                  {invoice.status === 'paid' && <Check className="mr-2 h-4 w-4" />}
                  Paid
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateInvoiceStatus('overdue')}
                  className="cursor-pointer"
                  disabled={invoice.status === 'overdue'}
                >
                  {invoice.status === 'overdue' && <Check className="mr-2 h-4 w-4" />}
                  Overdue
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateInvoiceStatus('cancelled')}
                  className="cursor-pointer"
                  disabled={invoice.status === 'cancelled'}
                >
                  {invoice.status === 'cancelled' && <Check className="mr-2 h-4 w-4" />}
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <Button 
                variant="secondary" 
                onClick={handleMarkAsPaid}
                disabled={updating}
              >
                <Check className="h-4 w-4 mr-2" /> 
                Mark as Paid
              </Button>
            )}
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Basic information about this invoice</CardDescription>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Client Information</h3>
                <div className="space-y-1">
                  <p className="font-medium">{invoice.client_name}</p>
                  <p>{invoice.client_email}</p>
                  <p className="whitespace-pre-line">{invoice.client_address}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p>{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="capitalize">{invoice.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p>{formatDate(invoice.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p>{formatDate(invoice.due_date)}</p>
                  </div>
                  {invoice.payment_date && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p>{formatDate(invoice.payment_date)}</p>
                    </div>
                  )}
                  {invoice.payment_terms && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p>{invoice.payment_terms}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Quantity
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{item.description}</td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right font-medium">
                      Subtotal
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                  </tr>
                  {invoice.tax_amount > 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right font-medium">
                        Tax
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatCurrency(invoice.tax_amount)}
                      </td>
                    </tr>
                  )}
                  {invoice.discount_amount > 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right font-medium">
                        Discount
                      </td>
                      <td className="py-3 px-4 text-right">
                        -{formatCurrency(invoice.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right font-medium text-lg">
                      Total
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lg">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Enter the date when payment was received for this invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateInvoiceStatus('paid', paymentDate)}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardWrapper>
  );
} 