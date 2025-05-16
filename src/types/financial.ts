import type { Database } from "@/app/types/supabase";
import { type CurrencyCode } from "@/lib/utils";

export type { CurrencyCode };

export type Category = Database["public"]["Tables"]["categories"]["Row"];

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "cash" | "other";
  balance: number;
  currency: CurrencyCode;
  is_active: boolean;
  institution?: string | null;
  account_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type BankAccount = Account;

export type TransactionType = "income" | "expense" | "transfer";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type TransactionStatus = Database["public"]["Tables"]["transactions"]["Row"]["status"];

export interface TransactionFormData {
  id?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  date: string;
  notes?: string;
  is_recurring: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  next_occurrence_date?: string;
  category?: Category;
  account?: Account;
}

export type FinancialGoal = Database["public"]["Tables"]["financial_goals"]["Row"] & {
  category?: Database["public"]["Tables"]["categories"]["Row"];
  contributions?: Database["public"]["Tables"]["goal_contributions"]["Row"][];
};

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  date: string;
  notes?: string;
  transaction_id?: string;
  transaction?: Transaction;
  created_at: string;
  updated_at: string;
}

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  category?: Category;
  account?: Account;
};

export interface RecurringTransaction extends Transaction {
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string;
  last_occurrence?: string;
  next_occurrence?: string;
  is_active: boolean;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_recurring?: boolean;
  recurrence_period?: "daily" | "weekly" | "monthly" | "yearly";
  created_at: string;
  budget_categories: BudgetCategory[];
  budget_tracking?: BudgetTracking[];
}

export interface BudgetTracking {
  id: string;
  user_id: string;
  budget_id: string;
  amount: number;
  spent: number;
  remaining: number;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: string;
  user_id: string;
  company_name?: string;
  default_currency: CurrencyCode;
  country?: string;
  fiscal_year_start?: string;
  created_at: string;
  updated_at: string;
}

export interface ChartOfAccount {
  id: string;
  user_id: string;
  name: string;
  code: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense" | "checking" | "savings" | "credit" | "investment" | "cash" | "other";
  description?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  balance?: number;
  currency?: CurrencyCode | string;
  institution?: string | null;
  account_number?: string | null;
  created_at: string;
  updated_at: string;
} 