export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  account_id: string;
  status: "pending" | "completed" | "reconciled";
  notes?: string;
  is_recurring?: boolean;
  recurrence_frequency?: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  recurrence_start_date?: string;
  recurrence_end_date?: string;
  next_occurrence_date?: string;
  parent_transaction_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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
  type: "income" | "expense";
  color?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
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
