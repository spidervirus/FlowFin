import { createClient } from "../../supabase/client";
import {
  Account,
  Transaction,
  Category,
  ReportFilter,
  ReportData,
  ReconciliationItem,
} from "@/types/financial";

const supabase = createClient();

// Accounts Management
export async function getAccounts() {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getAccount(id: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAccount(account: Partial<Account>) {
  const { data, error } = await supabase
    .from("accounts")
    .insert([
      {
        ...account,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAccount(id: string, updates: Partial<Account>) {
  const { data, error } = await supabase
    .from("accounts")
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

export async function deleteAccount(id: string) {
  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) throw error;
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
  let query = supabase
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
  const { data, error } = await supabase
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

export async function createTransaction(transaction: Partial<Transaction>) {
  // Start a transaction to update account balance
  const { data: accountData, error: accountError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", transaction.account_id)
    .single();

  if (accountError) throw accountError;

  // Calculate new balance
  let newBalance = accountData.balance;
  if (transaction.type === "income") {
    newBalance += transaction.amount;
  } else if (transaction.type === "expense") {
    newBalance -= transaction.amount;
  }

  // Update account balance
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", transaction.account_id);

  if (updateError) throw updateError;

  // Create the transaction
  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        ...transaction,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
  originalTransaction?: Transaction,
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
      await supabase
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
    const { error: updateOriginalError } = await supabase
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
      await supabase
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
    const { error: updateTargetError } = await supabase
      .from("accounts")
      .update({
        balance: targetAccountNewBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetAccountId);

    if (updateTargetError) throw updateTargetError;
  }

  // Update the transaction
  const { data, error } = await supabase
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

export async function deleteTransaction(id: string) {
  // Get the transaction to adjust account balance
  const { data: transaction, error: getError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (getError) throw getError;

  // Get current account balance
  const { data: accountData, error: accountError } = await supabase
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
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", transaction.account_id);

  if (updateError) throw updateError;

  // Delete the transaction
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// Categories Management
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getCategory(id: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory(category: Partial<Category>) {
  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        ...category,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { data, error } = await supabase
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
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// Reports Generation
export async function generateIncomeStatement(
  filter: ReportFilter,
): Promise<ReportData> {
  // Set default date range if not provided
  const endDate = filter.endDate || new Date().toISOString().split("T")[0];
  const startDate =
    filter.startDate ||
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0];

  // Get all transactions within date range
  let query = supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(id, name, type)
    `,
    )
    .gte("date", startDate)
    .lte("date", endDate);

  // Apply additional filters
  if (filter.accounts && filter.accounts.length > 0) {
    query = query.in("account_id", filter.accounts);
  }

  if (filter.categories && filter.categories.length > 0) {
    query = query.in("category_id", filter.categories);
  }

  if (filter.type && filter.type !== "all") {
    query = query.eq("type", filter.type);
  }

  const { data: transactions, error } = await query;

  if (error) throw error;

  // Calculate income and expenses
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = income - expenses;
  const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

  // Group transactions by category
  const categorySummary = transactions.reduce(
    (acc, transaction) => {
      const categoryId = transaction.category_id;
      const categoryName = transaction.category?.name || "Uncategorized";
      const categoryType =
        transaction.category?.type ||
        (transaction.type === "income" ? "income" : "expense");

      if (!acc[categoryType]) {
        acc[categoryType] = {};
      }

      if (!acc[categoryType][categoryId]) {
        acc[categoryType][categoryId] = {
          id: categoryId,
          name: categoryName,
          amount: 0,
          transactions: [],
        };
      }

      acc[categoryType][categoryId].amount += transaction.amount;
      acc[categoryType][categoryId].transactions.push(transaction);

      return acc;
    },
    { income: {}, expense: {} },
  );

  return {
    title: "Income Statement",
    dateRange: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit,
      profitMargin,
    },
    data: {
      categorySummary,
      transactions,
    },
  };
}

export async function generateBalanceSheet(): Promise<ReportData> {
  // Get all accounts
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*");

  if (accountsError) throw accountsError;

  // Calculate assets, liabilities, and equity
  const assets = accounts
    .filter((a) =>
      ["checking", "savings", "investment", "cash"].includes(a.type),
    )
    .reduce((sum, a) => sum + a.balance, 0);

  const liabilities = accounts
    .filter((a) => ["credit"].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0);

  const equity = assets - liabilities;

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }

    acc[account.type].push(account);
    return acc;
  }, {});

  return {
    title: "Balance Sheet",
    dateRange: {
      start: "",
      end: new Date().toISOString().split("T")[0],
    },
    summary: {
      totalIncome: assets,
      totalExpenses: liabilities,
      netProfit: equity,
      profitMargin: 0,
    },
    data: {
      assets,
      liabilities,
      equity,
      accountsByType,
      accounts,
    },
  };
}

export async function generateCashFlowStatement(
  filter: ReportFilter,
): Promise<ReportData> {
  // Set default date range if not provided
  const endDate = filter.endDate || new Date().toISOString().split("T")[0];
  const startDate =
    filter.startDate ||
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0];

  // Get all transactions within date range
  let query = supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(id, name, type)
    `,
    )
    .gte("date", startDate)
    .lte("date", endDate);

  // Apply additional filters
  if (filter.accounts && filter.accounts.length > 0) {
    query = query.in("account_id", filter.accounts);
  }

  const { data: transactions, error } = await query;

  if (error) throw error;

  // Group transactions by date
  const transactionsByDate = transactions.reduce((acc, transaction) => {
    const date = transaction.date;

    if (!acc[date]) {
      acc[date] = {
        date,
        income: 0,
        expense: 0,
        net: 0,
        transactions: [],
      };
    }

    if (transaction.type === "income") {
      acc[date].income += transaction.amount;
    } else if (transaction.type === "expense") {
      acc[date].expense += transaction.amount;
    }

    acc[date].net = acc[date].income - acc[date].expense;
    acc[date].transactions.push(transaction);

    return acc;
  }, {});

  // Convert to array and sort by date
  const cashFlowByDate = Object.values(transactionsByDate).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Calculate running balance
  let runningBalance = 0;
  cashFlowByDate.forEach((day) => {
    runningBalance += day.net;
    day.balance = runningBalance;
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  return {
    title: "Cash Flow Statement",
    dateRange: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalIncome,
      totalExpenses,
      netProfit: netCashFlow,
      profitMargin: 0,
    },
    data: {
      cashFlowByDate,
      transactions,
    },
  };
}

// Bank Reconciliation
export async function startReconciliation(
  accountId: string,
  statementDate: string,
  statementBalance: number,
) {
  // Create reconciliation record
  const { data: reconciliation, error } = await supabase
    .from("reconciliations")
    .insert([
      {
        account_id: accountId,
        statement_date: statementDate,
        statement_balance: statementBalance,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Get all unreconciled transactions for this account
  const { data: transactions, error: transactionsError } = await supabase
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
    const { error: itemsError } = await supabase
      .from("reconciliation_items")
      .insert(reconciliationItems);

    if (itemsError) throw itemsError;
  }

  return reconciliation;
}

export async function getReconciliation(id: string) {
  const { data: reconciliation, error } = await supabase
    .from("reconciliations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  // Get reconciliation items with transactions
  const { data: items, error: itemsError } = await supabase
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

  const { data, error } = await supabase
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
    const { error: transactionError } = await supabase
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

  // Check if all items are reconciled
  const allReconciled = reconciliation.items.every(
    (item) => item.is_reconciled,
  );

  if (!allReconciled) {
    throw new Error(
      "Cannot complete reconciliation: not all items are reconciled",
    );
  }

  // Update reconciliation status
  const { data, error } = await supabase
    .from("reconciliations")
    .update({
      is_completed: true,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Update account balance to match statement balance
  const { error: accountError } = await supabase
    .from("accounts")
    .update({
      balance: reconciliation.statement_balance,
      updated_at: now,
    })
    .eq("id", reconciliation.account_id);

  if (accountError) throw accountError;

  return data;
}

export async function getAccountReconciliations(accountId: string) {
  const { data, error } = await supabase
    .from("reconciliations")
    .select("*")
    .eq("account_id", accountId)
    .order("statement_date", { ascending: false });

  if (error) throw error;
  return data;
}
