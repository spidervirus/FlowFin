"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ArrowLeft, FileText, Send } from "lucide-react";

interface QuoteDetailPageProps {
  params: {
    id: string;
  };
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<string>("USD");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchQuote();
  }, [params.id]);

  const fetchQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          customers (*),
          quote_items (*)
        `)
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (quoteError) throw quoteError;
      setQuote(quoteData);
    } catch (error) {
      console.error("Error fetching quote:", error);
      toast.error("Failed to load quote");
      router.push("/dashboard/sales/quotes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendQuote = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("quotes")
        .update({
          status: "sent",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (error) throw error;

      toast.success("Quote marked as sent");
      fetchQuote();
    } catch (error) {
      console.error("Error sending quote:", error);
      toast.error("Failed to send quote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    // TODO: Implement PDF generation
    toast.info("PDF generation coming soon");
  };

  const getStatusBadgeVariant = (status: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div>Loading...</div>
      </DashboardWrapper>
    );
  }

  if (!quote) {
    return (
      <DashboardWrapper>
        <div>Quote not found</div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <DashboardHeader
        heading={`Quote ${quote.quote_number}`}
        text="View and manage quote details."
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/sales/quotes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {quote.status === "draft" && (
            <Button onClick={handleSendQuote}>
              <Send className="h-4 w-4 mr-2" />
              Send Quote
            </Button>
          )}
          <Button variant="outline" onClick={handleGeneratePDF}>
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6">
        {/* Quote Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <p>{quote.customers?.company_name}</p>
                <p>{quote.customers?.contact_name}</p>
                <p>{quote.customers?.email}</p>
                <p>{quote.customers?.phone}</p>
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <div className="flex justify-end items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <Badge variant={getStatusBadgeVariant(quote.status)}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Date: </span>
                    {format(new Date(quote.date), "MMM d, yyyy")}
                  </div>
                  {quote.expiry_date && (
                    <div>
                      <span className="font-semibold">Expiry Date: </span>
                      {format(new Date(quote.expiry_date), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-semibold">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              <Separator />
              {quote.quote_items.map((item: any) => (
                <div key={item.id} className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">{item.description}</div>
                  <div className="col-span-2">{item.quantity}</div>
                  <div className="col-span-2">{formatCurrency(item.unit_price)}</div>
                  <div className="col-span-2 text-right">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({quote.tax_rate}%):</span>
                    <span>{formatCurrency(quote.tax_amount)}</span>
                  </div>
                )}
                {quote.discount_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Discount ({quote.discount_rate}%):</span>
                    <span>-{formatCurrency(quote.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Notes */}
        {(quote.terms || quote.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quote.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{quote.terms}</p>
                </CardContent>
              </Card>
            )}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
} 