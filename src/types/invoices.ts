import { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];
export type Invoice = Tables["invoices"]["Row"];
export type InvoiceInsert = Tables["invoices"]["Insert"];

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceFormValues {
  invoice_number: string;
  date: string;
  due_date: string;
  account_id: string;
  client_name: string;
  client_email: string;
  client_address: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes?: string;
  payment_terms?: string;
} 