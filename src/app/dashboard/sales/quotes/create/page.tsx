"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { QuoteForm } from "@/components/forms/QuoteForm";
import DashboardWrapper from "../../../dashboard-wrapper";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { generateQuoteNumber } from "@/lib/utils/quotes";
import { type QuoteFormValues } from "@/components/forms/QuoteForm";

export default function CreateQuotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (data: QuoteFormValues) => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated. Please sign in.");
        setIsSubmitting(false);
        return;
      }
      
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      const taxAmount = (subtotal * (data.tax_rate || 0)) / 100;
      const discountAmount = (subtotal * (data.discount_rate || 0)) / 100;
      const total = subtotal + taxAmount - discountAmount;
      
      // Generate quote number if not already present (e.g., for new quotes)
      let finalQuoteNumber = data.quote_number;
      if (!finalQuoteNumber) {
        finalQuoteNumber = await generateQuoteNumber(supabase);
      }
      
      const quoteInsertPayload = {
        user_id: user.id,
        quote_number: finalQuoteNumber,
        customer_id: data.customer_id,
        date: data.quote_date.toISOString(),
        expiry_date: data.expiry_date ? data.expiry_date.toISOString() : null,
        status: data.status,
        terms: data.terms,
        notes: data.notes,
        template_id: data.template_id,
        tax_rate: data.tax_rate,
        tax_amount: taxAmount,
        discount_rate: data.discount_rate,
        discount_amount: discountAmount,
        subtotal: subtotal,
        total_amount: total,
      };

      console.log("--- Inserting into QUOTES table ---");
      console.log("Payload:", JSON.stringify(quoteInsertPayload, null, 2));

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert(quoteInsertPayload)
        .select("id")
        .single();

      if (quoteError) throw quoteError;
      if (!quoteData || !quoteData.id) throw new Error("Quote ID not found after creation");

      const quoteItemsInsertPayload = data.items.map((item) => ({
        quote_id: quoteData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      console.log("--- Inserting into QUOTE_ITEMS table ---");
      console.log("Payload:", JSON.stringify(quoteItemsInsertPayload, null, 2));

      const { error: itemsError } = await supabase.from("quote_items").insert(quoteItemsInsertPayload);

      if (itemsError) throw itemsError;

      toast.success("Quote created successfully!");
      router.push(`/dashboard/sales/quotes/${quoteData.id}`);
    } catch (error) {
      console.error("Error creating quote:", error);
      toast.error("Failed to create quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardWrapper>
      <DashboardHeader
        heading="Create Quote"
        text="Create a new quote for your customer."
      />
      <div className="space-y-6">
        <QuoteForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </DashboardWrapper>
  );
} 