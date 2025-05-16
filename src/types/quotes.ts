import { z } from "zod";
import { Database } from "@/lib/supabase/database.types";

export type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];
export type QuoteItemInsert = Database["public"]["Tables"]["quote_items"]["Insert"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"] & {
  customers?: Database["public"]["Tables"]["customers"]["Row"];
  quote_items?: QuoteItem[];
};

export const quoteItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit_price: z.number().min(0, "Unit price must be greater than or equal to 0"),
});

export type QuoteFormItem = z.infer<typeof quoteItemSchema>;

export const quoteFormSchema = z.object({
  quote_number: z.string().min(1, "Quote number is required"),
  customer_id: z.string().min(1, "Customer is required"),
  date: z.date(),
  expiry_date: z.date().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  terms: z.string().optional(),
  notes: z.string().optional(),
  template_id: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  discount_rate: z.number().min(0).max(100).optional(),
  items: z.array(quoteItemSchema),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>; 