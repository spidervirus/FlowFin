// Type definitions for financial entities
export type TransactionType = "income" | "expense";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
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
} 