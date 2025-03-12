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
