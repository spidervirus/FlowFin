import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";

type Tables = Database["public"]["Tables"];

export type Payment = {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  currency_code: CurrencyCode;
  payment_method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
  reference_number?: string;
  bank_account?: string;
  check_number?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
};

export type PaymentInsert = Omit<Payment, "id" | "created_at" | "updated_at">;

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "credit_card",
  "debit_card",
  "check",
  "paypal",
  "stripe",
  "other"
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const paymentSchema = z.object({
  id: z.string().optional(),
  invoice_id: z.string().min(1, "Invoice is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency_code: z.enum(Object.keys(CURRENCY_CONFIG) as [string, ...string[]], {
    required_error: "Currency is required",
  }),
  payment_method: z.enum(PAYMENT_METHODS, {
    required_error: "Payment method is required",
  }),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
  reference_number: z.string().optional(),
  bank_account: z.string().optional(),
  check_number: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export interface PaymentWithInvoice extends Payment {
  invoice?: {
    invoice_number: string;
    client_name: string;
    total_amount: number;
    currency_code: CurrencyCode;
  };
  transaction?: {
    id: string;
    reference: string;
  };
} 