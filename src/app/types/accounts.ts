export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "cash"
  | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}
