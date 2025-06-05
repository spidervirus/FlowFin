"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Send,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import DashboardWrapper from "../../dashboard-wrapper";
import { format } from "date-fns";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Quote, Customer, QuoteStatus } from "@/types/sales";

export default function QuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState<string>("USD");

  const supabase = createClient();

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to view quotes");
        return;
      }

      // Fetch company settings for currency
      const { data: settings, error: settingsError } = await supabase
        .from("company_settings")
        .select("default_currency")
        .eq("user_id", user.id)
        .single();

      if (settingsError) {
        console.error("Error fetching company settings:", settingsError);
      } else if (settings?.default_currency) {
        setCurrency(settings.default_currency);
      }

      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          customer:customers (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data as any[] as Quote[]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error loading quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();

    // Set up real-time subscription for quotes
    const channel = supabase
      .channel('custom-quotes-channel') // Use a unique channel name
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'quotes',
          // filter: `user_id=eq.${user?.id}` // Ensure user is defined before using here if needed.
          // For simplicity, fetching all and relying on RLS or client-side filter for now.
          // Or, fetch user ID once and use it here if channel setup allows async.
        },
        (payload) => {
          console.log('Change received!', payload);
          toast.info("Quote data updated in real-time.");
          fetchQuotes(); // Re-fetch quotes on any change
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]); // Add supabase to dependency array

  const getStatusBadgeVariant = (status: QuoteStatus) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "default";
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      case "expired":
        return "outline";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount ?? 0);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      quote.quote_number?.toLowerCase().includes(searchLower) ||
      quote.customer?.name?.toLowerCase().includes(searchLower) ||
      quote.status.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateQuote = () => {
    router.push("/dashboard/sales/quotes/create");
  };

  const handleEditQuote = (id: string) => {
    router.push(`/dashboard/sales/quotes/${id}/edit`);
  };

  const handleViewQuote = (id: string) => {
    router.push(`/dashboard/sales/quotes/${id}`);
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Create invoice from quote
      // Construct a specific payload for the invoice
      // Ensure all fields are valid for the 'invoices' table schema
      const invoicePayload = {
        user_id: quote.user_id,
        customer_id: quote.customer_id,
        date: quote.quote_date,
        invoice_number: `INV-${Date.now()}`.substring(0,15),
        due_date: quote.expiry_date, 
        status: "draft" as const,
        subtotal: quote.subtotal,
        discount_amount: quote.discount_amount,
        tax_amount: quote.tax_amount,
        total: quote.total,
        terms: quote.terms,
        notes: quote.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), 
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert(invoicePayload) // Use the constructed payload
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update quote status to accepted
      const { error: updateError } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quoteId);

      if (updateError) throw updateError;

      toast.success("Quote converted to invoice successfully");
      router.push(`/dashboard/sales/invoices/${invoice.id}/edit`);
    } catch (error) {
      console.error("Error converting quote to invoice:", error);
      toast.error("Failed to convert quote to invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required to delete.");
        setLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (deleteError) throw deleteError;

      toast.success("Quote deleted successfully");
      fetchQuotes();
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error("Failed to delete quote");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSent = async (quoteId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required to update status.");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("quotes")
        .update({ status: "sent" })
        .eq("id", quoteId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Quote marked as sent");
      await fetchQuotes();
    } catch (error) {
      console.error("Error marking quote as sent:", error);
      toast.error("Failed to mark quote as sent");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading quotes...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <DashboardHeader
        heading="Quotes"
        text="Create and manage quotes for your customers."
      >
        <Button onClick={handleCreateQuote}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quote
        </Button>
      </DashboardHeader>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Quotes</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No quotes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/sales/quotes/${quote.id}`}
                          className="font-medium hover:underline"
                        >
                          {quote.quote_number || `Quote ID: ${quote.id.substring(0,8)}`}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.customer?.name}</TableCell>
                      <TableCell>
                        {quote.quote_date ? format(new Date(quote.quote_date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {quote.expiry_date
                          ? format(new Date(quote.expiry_date), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(quote.status)}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewQuote(quote.id)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditQuote(quote.id)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleMarkAsSent(quote.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'sent' && (
                              <DropdownMenuItem onClick={() => handleConvertToInvoice(quote.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Convert to Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
} 