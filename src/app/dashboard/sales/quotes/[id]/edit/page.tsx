"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { QuoteForm } from "@/components/forms/QuoteForm";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface EditQuotePageProps {
  params: {
    id: string;
  };
}

export default function EditQuotePage({ params }: EditQuotePageProps) {
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchQuote();
  }, [params.id]);

  const fetchQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch quote and its items
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (quoteError) throw quoteError;

      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", params.id);

      if (itemsError) throw itemsError;

      setQuote({
        ...quoteData,
        items: items || [],
      });
    } catch (error) {
      console.error("Error fetching quote:", error);
      toast.error("Failed to load quote");
      router.push("/dashboard/sales/quotes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (quoteError) throw quoteError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", params.id);

      if (deleteError) throw deleteError;

      // Insert new items
      if (data.items && data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("quote_items")
          .insert(
            data.items.map((item: any) => ({
              quote_id: params.id,
              ...item,
            }))
          );

        if (itemsError) throw itemsError;
      }

      toast.success("Quote updated successfully");
      router.push("/dashboard/sales/quotes");
    } catch (error) {
      console.error("Error updating quote:", error);
      toast.error("Failed to update quote");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div>Loading...</div>
      </DashboardWrapper>
    );
  }

  if (!quote) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div>Quote not found</div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <DashboardHeader
        heading="Edit Quote"
        text="Update the quote details."
      />
      <div className="space-y-6">
        <QuoteForm
          defaultValues={quote}
          onSubmit={handleSubmit}
          isSubmitting={isLoading}
        />
      </div>
    </DashboardWrapper>
  );
} 