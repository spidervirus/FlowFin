import type { CurrencyCode } from "./financial"; // Assuming CurrencyCode might be needed later, or for consistency

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_city?: string | null;
  billing_state_province?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state_province?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  tax_id?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  unit_price: number; // Assuming it will be handled as number in frontend, DECIMAL in DB
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_id?: string | null; // Link to Item table
  description: string; // Can be from Item or custom
  quantity: number;
  unit_price: number;
  amount: number; // quantity * unit_price
  created_at: string;
  updated_at: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'rejected' | 'expired' | 'invoiced' | 'paid' | 'void' | 'archived';

export interface Quote {
  id: string;
  user_id: string;
  customer_id?: string | null; // Link to Customer table
  quote_number?: string | null;
  quote_date: string; // TIMESTAMPTZ
  expiry_date?: string | null; // TIMESTAMPTZ
  status: QuoteStatus;
  subtotal?: number;
  discount_rate?: number | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total?: number;
  terms?: string | null;
  notes?: string | null;
  template_id?: string | null; // Link to QuoteTemplate table
  created_at: string;
  updated_at: string;
  // Potentially populated relations
  items?: QuoteItem[];
  customer?: Customer; // If fetched with join
  // quote_template?: QuoteTemplate; // If fetched with join
}

// Add other sales-related interfaces here as we define them (e.g., Invoice, DeliveryCharge) 