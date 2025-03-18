import { CurrencyCode } from '@/lib/utils';

export interface Transaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  user_id?: string;
  category?: Category | string;
  status?: string;
  payment_date?: string | null;
  created_at?: string;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "cash" | "other";
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

export interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
  user_id?: string;
  created_at?: string;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  accounts?: string[];
  categories?: string[];
  type?: "income" | "expense" | "all";
}

export interface ReportData {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  data: any;
}

export interface ReconciliationItem {
  id: string;
  account_id: string;
  transaction_id: string;
  statement_date: string;
  bank_amount: number;
  book_amount: number;
  is_reconciled: boolean;
  reconciled_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ReceiptItem {
  id: string;
  transaction_id: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  recurrence_period?: "monthly" | "quarterly" | "yearly";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  budget_categories?: BudgetCategory[];
  tracking?: BudgetTracking[];
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface BudgetTracking {
  id: string;
  budget_id: string;
  category_id: string;
  month: string;
  planned_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface DashboardSettings {
  id: string;
  user_id: string;
  layout: Record<string, any>;
  theme: string;
  default_view: string;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  position: number;
  visible: boolean;
  settings?: Record<string, any>;
}

export interface FinancialGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  category_id?: string;
  is_completed: boolean;
  is_active: boolean;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  category?: Category;
  contributions?: GoalContribution[];
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  notes?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  transaction?: Transaction;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  invoice_number: string;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  subtotal: number;
  tax?: number;
  total: number;
  currency: CurrencyCode;
  payment_date?: string | null;
  created_at?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface CompanySettings {
  id?: string;
  user_id: string;
  company_name: string;
  address: string;
  country: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
  industry: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: Category | string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
}
