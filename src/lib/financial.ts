import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { CurrencyCode } from "@/lib/utils";
import { SupabaseClient } from "@supabase/supabase-js";

// Custom error class for financial operations
export class FinancialError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "FinancialError";
  }
}

// Supabase client singleton with proper typing
let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient();
      
      // Validate client initialization
      if (!supabaseInstance.auth || !supabaseInstance.from) {
        throw new Error("Supabase client not properly initialized");
      }
    } catch (error) {
      throw new FinancialError("Failed to initialize Supabase client", error);
    }
  }
  return supabaseInstance;
}

// Helper function to validate client connection before operations
async function validateClientConnection(): Promise<void> {
  try {
    const client = getSupabaseClient();
    // Simple query to validate connection
    await client.from("accounts").select("id").limit(1);
  } catch (error) {
    throw new FinancialError("Failed to validate database connection", error);
  }
}

// Type definitions
export type TransactionType = "income" | "expense" | "transfer";
export type AccountType = "checking" | "savings" | "credit" | "investment" | "cash" | "other";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type TransactionStatus = "pending" | "completed" | "reconciled";

// Base types
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  department?: string;
  status?: "active" | "inactive";
  salary?: number;
  hire_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  address: string;
  country: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
  industry: string;
  phone_number?: string;
  company_size?: string;
  tax_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id?: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institution?: string | null;
  account_number?: string | null;
  is_active?: boolean;
  notes?: string | null;
  code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id?: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  account_id: string;
  status: TransactionStatus;
  notes: string | null;
  is_recurring: boolean | null;
  recurrence_frequency: RecurrenceFrequency | null;
  next_occurrence_date: string | null;
  created_at?: string;
  updated_at: string;
  category?: Category | null;
}

export interface Category {
  id?: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  description?: string | null;
  color?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at: string;
}

// Report Types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  accounts?: string[];
  categories?: string[];
  type?: "all" | TransactionType;
}

export interface CategorySummary {
  id: string;
  name: string;
  amount: number;
  transactions: Transaction[];
}

export interface DailyTransactionSummary {
  date: string;
  income: number;
  expense: number;
  net: number;
  transactions: Transaction[];
  balance?: number;
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
  data: {
    categorySummary?: {
      income: Record<string, CategorySummary>;
      expense: Record<string, CategorySummary>;
    };
    transactions?: Transaction[];
    assets?: number;
    liabilities?: number;
    equity?: number;
    accountsByType?: Record<string, Account[]>;
    accounts?: Account[];
    cashFlowByDate?: DailyTransactionSummary[];
  };
}

export interface Reconciliation {
  id?: string;
  user_id: string;
  account_id: string;
  statement_date: string;
  statement_balance: number;
  is_completed?: boolean | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at: string;
}

export interface ReconciliationItem {
  id?: string;
  reconciliation_id: string;
  transaction_id: string;
  is_reconciled: boolean;
  reconciled_at: string | null;
  created_at?: string;
  updated_at: string;
  transaction?: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category_id: string | null;
    account_id: string;
    status: TransactionStatus;
    notes: string | null;
    is_recurring: boolean;
    recurrence_frequency: RecurrenceFrequency | null;
    next_occurrence_date: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
  } | null;
}

// Replace the direct client initialization with the getter
const getClient = () => {
  try {
    return getSupabaseClient();
  } catch (error) {
    throw new FinancialError("Failed to get Supabase client", error);
  }
};

// Function types
interface CreateTransactionInput {
  user_id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  category_id?: string | null;
  notes?: string | null;
  is_recurring?: boolean | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  next_occurrence_date?: string | null;
  status?: TransactionStatus;
}

export async function createTransaction(transaction: CreateTransactionInput) {
  const supabase = getClient();
  
  try {
    await validateClientConnection();
    
    // Validate required fields
    const requiredFields = ['user_id', 'account_id', 'amount', 'type', 'description', 'date'] as const;
    const missingFields = requiredFields.filter(field => !transaction[field]);
    
    if (missingFields.length > 0) {
      throw new FinancialError(`Missing required transaction fields: ${missingFields.join(', ')}`);
    }

    if (transaction.amount <= 0) {
      throw new FinancialError("Transaction amount must be positive");
    }

    if (!["income", "expense", "transfer"].includes(transaction.type)) {
      throw new FinancialError("Invalid transaction type");
    }

    // Start a transaction to update account balance
    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", transaction.account_id)
      .single();

    if (accountError) throw new FinancialError("Failed to fetch account", accountError);
    if (!accountData) throw new FinancialError("Account not found");

    // Calculate new balance
    let newBalance = accountData.balance;
    if (transaction.type === "income") {
      newBalance += transaction.amount;
    } else if (transaction.type === "expense") {
      newBalance -= transaction.amount;
      if (newBalance < 0) {
        console.warn("Account balance will be negative", {
          accountId: transaction.account_id,
          currentBalance: accountData.balance,
          transactionAmount: transaction.amount,
        });
      }
    }

    // Update account balance
    const { error: updateError } = await supabase
      .from("accounts")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", transaction.account_id);

    if (updateError) throw new FinancialError("Failed to update account balance", updateError);

    // Create the transaction with default values for optional fields
    const transactionData = {
      ...transaction,
      status: transaction.status || "pending",
      is_recurring: transaction.is_recurring || false,
      notes: transaction.notes || null,
      category_id: transaction.category_id || null,
      recurrence_frequency: transaction.recurrence_frequency || null,
      next_occurrence_date: transaction.next_occurrence_date || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select()
      .single();

    if (error) throw new FinancialError("Failed to create transaction", error);
    return data;
  } catch (error) {
    if (error instanceof FinancialError) {
      throw error;
    }
    throw new FinancialError("Unexpected error during transaction creation", error);
  }
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
  originalTransaction: Transaction,
) {
  // If we're updating amount, type, or account, we need to adjust account balances
  if (
    originalTransaction &&
    (updates.amount !== undefined ||
      updates.type !== undefined ||
      updates.account_id !== undefined)
  ) {
    // Revert original transaction effect on original account
    const { data: originalAccountData, error: originalAccountError } =
      await getClient()
        .from("accounts")
        .select("balance")
        .eq("id", originalTransaction.account_id)
        .single();

    if (originalAccountError) throw originalAccountError;

    let originalAccountNewBalance = originalAccountData.balance;
    if (originalTransaction.type === "income") {
      originalAccountNewBalance -= originalTransaction.amount;
    } else if (originalTransaction.type === "expense") {
      originalAccountNewBalance += originalTransaction.amount;
    }

    // Update original account balance
    const { error: updateOriginalError } = await getClient()
      .from("accounts")
      .update({
        balance: originalAccountNewBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", originalTransaction.account_id);

    if (updateOriginalError) throw updateOriginalError;

    // If account changed, apply new transaction to new account
    const targetAccountId =
      updates.account_id || originalTransaction.account_id;
    const transactionType = updates.type || originalTransaction.type;
    const transactionAmount = updates.amount || originalTransaction.amount;

    const { data: targetAccountData, error: targetAccountError } =
      await getClient()
        .from("accounts")
        .select("balance")
        .eq("id", targetAccountId)
        .single();

    if (targetAccountError) throw targetAccountError;

    let targetAccountNewBalance = targetAccountData.balance;
    if (transactionType === "income") {
      targetAccountNewBalance += transactionAmount;
    } else if (transactionType === "expense") {
      targetAccountNewBalance -= transactionAmount;
    }

    // Update target account balance
    const { error: updateTargetError } = await getClient()
      .from("accounts")
      .update({
        balance: targetAccountNewBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetAccountId);

    if (updateTargetError) throw updateTargetError;
  }

  // Update the transaction
  const { data, error } = await getClient()
    .from("transactions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Accounts Management
export async function getAccounts() {
  const { data, error } = await getClient()
    .from("chart_of_accounts")
    .select("*")
    .order("name");

  if (error) throw new FinancialError("Failed to fetch accounts", error);
  // Add balance: 0 to each account object from chart_of_accounts
  return (data || []).map(acc => ({ ...acc, balance: 0 })) as Account[];
}

export async function getAccountById(id: string) {
  if (!id) {
    throw new FinancialError("Account ID is required to fetch an account.");
  }
  const { data, error } = await getClient()
    .from("chart_of_accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new FinancialError("Failed to fetch account by ID", error);
  }
  // Add balance: 0 to the account object from chart_of_accounts
  return data ? { ...data, balance: 0 } as Account : null;
}

export async function createAccount(
  account: Omit<Account, "id" | "created_at" | "updated_at" | "balance"> & { user_id: string; code?: string; } 
) {
  const { id, balance, ...accountData } = account as Account; 

  const { data, error } = await getClient()
    .from("chart_of_accounts")
    .insert([
      {
        ...accountData,
        code: accountData.code || accountData.name.substring(0, 3).toUpperCase() + Math.floor(Math.random()*100), 
        name: accountData.name,
        type: accountData.type,
        user_id: accountData.user_id,
        currency: accountData.currency || "USD",
        is_active: accountData.is_active ?? true,
      },
    ])
    .select()
    .single();

  if (error) throw new FinancialError("Failed to create account", error);
  // Add balance: 0 to the returned account object to satisfy the Account type
  return { ...data, balance: 0 } as Account; 
}

export async function updateAccount(id: string, updates: Partial<Omit<Account, "id" | "user_id" | "created_at" | "balance">>) { 
  if (!id) {
    throw new FinancialError("Account ID is required for updates.");
  }
  const { error } = await getClient()
    .from("chart_of_accounts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new FinancialError("Failed to update account", error);
  return getAccountById(id);
}

export async function deleteAccount(id: string) {
  if (!id) {
    throw new FinancialError("Account ID is required for deletion.");
  }
  const { error } = await getClient()
    .from("chart_of_accounts")
    .delete()
    .eq("id", id);

  if (error) throw new FinancialError("Failed to delete account", error);
  return true;
}

// Transactions Management
export async function getTransactions(
  filters: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
    categoryId?: string;
    type?: "income" | "expense" | "transfer";
    status?: "pending" | "completed" | "reconciled";
    search?: string;
  } = {},
) {
  let query = getClient()
    .from("transactions")
    .select(
      `
      *,
      account:accounts(id, name),
      category:categories(id, name, type, color)
    `,
    )
    .order("date", { ascending: false });

  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  if (filters.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    query = query.ilike("description", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getTransaction(id: string) {
  const { data, error } = await getClient()
    .from("transactions")
    .select(
      `
      *,
      account:accounts(id, name),
      category:categories(id, name, type, color)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string) {
  // Get the transaction to adjust account balance
  const { data: transaction, error: getError } = await getClient()
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (getError) throw getError;

  // Get current account balance
  const { data: accountData, error: accountError } = await getClient()
    .from("accounts")
    .select("balance")
    .eq("id", transaction.account_id)
    .single();

  if (accountError) throw accountError;

  // Calculate new balance
  let newBalance = accountData.balance;
  if (transaction.type === "income") {
    newBalance -= transaction.amount;
  } else if (transaction.type === "expense") {
    newBalance += transaction.amount;
  }

  // Update account balance
  const { error: updateError } = await getClient()
    .from("accounts")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", transaction.account_id);

  if (updateError) throw updateError;

  // Delete the transaction
  const { error } = await getClient().from("transactions").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// Categories Management
export async function getCategories() {
  const { data, error } = await getClient()
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getCategory(id: string) {
  const { data, error } = await getClient()
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory(category: Partial<Category> & { user_id: string; name: string; type: "income" | "expense" }) {
  const { data, error } = await getClient()
    .from("categories")
    .insert([
      {
        ...category,
        is_active: category.is_active ?? true,
        is_default: category.is_default ?? false,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { data, error } = await getClient()
    .from("categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await getClient().from("categories").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// Reports Generation
function calculateCategoryTotals(transactions: Transaction[]): Record<string, CategorySummary> {
  const totals: Record<string, CategorySummary> = {};

  for (const transaction of transactions) {
    const categoryId = transaction.category_id || 'uncategorized';
    const categoryName = transaction.category?.name || 'Uncategorized';

    if (!totals[categoryId]) {
      totals[categoryId] = {
        id: categoryId,
        name: categoryName,
        amount: 0,
        transactions: [],
      };
    }

    totals[categoryId].amount += transaction.amount;
    totals[categoryId].transactions.push(transaction);
  }

  return totals;
}

export async function generateReport(
  startDate: string,
  endDate: string,
  filter: ReportFilter = {},
): Promise<ReportData> {
  const { data: fetchedTransactions, error } = await getClient()
    .from("transactions")
    .select(`
      *,
      category:categories (
        id,
        name,
        type,
        color,
        user_id,
        is_active,
        updated_at
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw new FinancialError("Failed to fetch transactions for report", error);
  if (!fetchedTransactions) throw new FinancialError("No transactions data returned for report");

  // Ensure each transaction object is valid before processing
  const typedTransactions = fetchedTransactions.map(t => {
    // Check if t itself is an error-like structure, though Supabase usually puts errors in the 'error' object
    if (!t || typeof t !== 'object' || t.id === undefined) { 
      console.warn("Skipping invalid transaction object in report:", t);
      return null; // Or some other way to filter it out later
    }
    return {
    ...t,
    category: t.category || null,
    is_recurring: t.is_recurring || false,
      recurrence_frequency: (t as any).recurrence_frequency as RecurrenceFrequency | null || null,
      next_occurrence_date: (t as any).next_occurrence_date as string | null || null,
    }
  }).filter(Boolean) as Transaction[]; // Filter out any nulls and cast

  const incomeTransactions = typedTransactions.filter(t => t.type === "income");
  const expenseTransactions = typedTransactions.filter(t => t.type === "expense");

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  return {
    title: `Financial Report (${startDate} to ${endDate})`,
    dateRange: { start: startDate, end: endDate },
    summary: {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
    },
    data: {
      categorySummary: {
        income: calculateCategoryTotals(incomeTransactions),
        expense: calculateCategoryTotals(expenseTransactions),
      },
      transactions: typedTransactions,
    },
  };
}

// Bank Reconciliation
export async function startReconciliation(
  accountId: string,
  statementDate: string,
  statementBalance: number,
  userId: string,
) {
  // Create reconciliation record
  const { data: reconciliation, error } = await getClient()
    .from("reconciliations")
    .insert([
      {
        user_id: userId,
        account_id: accountId,
        statement_date: statementDate,
        statement_balance: statementBalance,
        is_completed: false,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Get all unreconciled transactions for this account
  const { data: transactions, error: transactionsError } = await getClient()
    .from("transactions")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "completed")
    .lte("date", statementDate);

  if (transactionsError) throw transactionsError;

  // Create reconciliation items for each transaction
  const reconciliationItems = transactions.map((transaction) => ({
    reconciliation_id: reconciliation.id,
    transaction_id: transaction.id,
    is_reconciled: false,
  }));

  if (reconciliationItems.length > 0) {
    const { error: itemsError } = await getClient()
      .from("reconciliation_items")
      .insert(reconciliationItems);

    if (itemsError) throw itemsError;
  }

  return reconciliation;
}

export async function getReconciliation(id: string) {
  const { data: reconciliation, error } = await getClient()
    .from("reconciliations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  // Get reconciliation items with transactions
  const { data: items, error: itemsError } = await getClient()
    .from("reconciliation_items")
    .select(
      `
      *,
      transaction:transactions(*)
    `,
    )
    .eq("reconciliation_id", id);

  if (itemsError) throw itemsError;

  return {
    ...reconciliation,
    items,
  };
}

export async function updateReconciliationItem(
  id: string,
  isReconciled: boolean,
) {
  const now = new Date().toISOString();

  const { data, error } = await getClient()
    .from("reconciliation_items")
    .update({
      is_reconciled: isReconciled,
      reconciled_at: isReconciled ? now : null,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // If reconciled, update transaction status
  if (isReconciled) {
    const { error: transactionError } = await getClient()
      .from("transactions")
      .update({
        status: "reconciled",
        updated_at: now,
      })
      .eq("id", data.transaction_id);

    if (transactionError) throw transactionError;
  }

  return data;
}

export async function completeReconciliation(id: string) {
  const now = new Date().toISOString();

  // Get reconciliation with items
  const reconciliation = await getReconciliation(id);

  // Check if all items are reconciled and if item.transaction is a valid object
  const allReconciled = (reconciliation.items || []).every(
    (item) => {
      const transaction = item.transaction;
      let isValidTransactionObject = false;
      // Ensure transaction is a non-null object before checking for 'error' key
      if (transaction && transaction !== null && typeof transaction === 'object') {
        isValidTransactionObject = !('error' in (transaction as any));
      }
      return item.is_reconciled && isValidTransactionObject;
    }
  );

  if (!allReconciled) {
    throw new FinancialError("Cannot complete reconciliation: not all items are reconciled");
  }

  // Update reconciliation status
  const { data, error } = await getClient()
    .from("reconciliations")
    .update({
      is_completed: true,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new FinancialError("Failed to update reconciliation status", error);

  // Update account balance to match statement balance
  const { error: accountError } = await getClient()
    .from("accounts")
    .update({
      balance: reconciliation.statement_balance,
      updated_at: now,
    })
    .eq("id", reconciliation.account_id);

  if (accountError) throw new FinancialError("Failed to update account balance", accountError);

  return data;
}

export async function getAccountReconciliations(accountId: string) {
  const { data, error } = await getClient()
    .from("reconciliations")
    .select("*")
    .eq("account_id", accountId)
    .order("statement_date", { ascending: false });

  if (error) throw error;
  return data;
}
