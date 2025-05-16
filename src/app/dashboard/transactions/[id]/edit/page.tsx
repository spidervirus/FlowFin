"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from "@/components/transaction-components/transaction-form";
import DashboardWrapper from "../../../dashboard-wrapper";
import { Account, Category, TransactionFormData, TransactionType, RecurrenceFrequency } from "@/types/financial";
import { Database } from "@/lib/supabase/database.types";

type DbTransaction = Database["public"]["Tables"]["transactions"]["Row"];
type DbCategory = Database["public"]["Tables"]["categories"]["Row"];
type DbAccount = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

type Transaction = DbTransaction & {
  category?: DbCategory;
  account?: DbAccount;
};

export default function EditTransactionPage({
  params,
}: {
  params: { id: string };
}) {
  const [transaction, setTransaction] = useState<TransactionFormData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("You must be logged in to edit a transaction");
          return;
        }

        // Fetch transaction data with category and account
        const { data: transactionData, error: transactionError } =
          await supabase
            .from("transactions")
            .select(`
              *,
              category:categories(*),
              account:chart_of_accounts(*)
            `)
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        if (transactionError) {
          console.error("Error fetching transaction:", transactionError);
          return <div>Error loading transaction</div>;
        }
        if (!transactionData) {
          toast.error("Transaction not found");
          return;
        }

        // Explicitly cast transactionData to the expected shape after select
        const fullTransactionData = transactionData as (DbTransaction & { category?: DbCategory, account?: DbAccount });

        // Transform the data to match TransactionFormData interface
        const transformedTransaction: TransactionFormData = {
          id: fullTransactionData.id,
          description: fullTransactionData.description ?? '',
          amount: fullTransactionData.amount,
          type: fullTransactionData.type as TransactionType,
          category_id: fullTransactionData.category_id || '',
          account_id: fullTransactionData.account_id,
          date: fullTransactionData.date,
          notes: fullTransactionData.notes || '',
          is_recurring: fullTransactionData.is_recurring || false,
          category: fullTransactionData.category ? {
            ...(fullTransactionData.category as DbCategory),
            type: fullTransactionData.category.type as Category['type'],
            is_active: fullTransactionData.category.is_active ?? false,
            created_at: fullTransactionData.category.created_at ?? new Date().toISOString(),
            updated_at: fullTransactionData.category.updated_at ?? new Date().toISOString(),
            is_default: fullTransactionData.category.is_default ?? false,
          } : undefined,
          account: fullTransactionData.account ? {
            id: fullTransactionData.account.id,
            user_id: fullTransactionData.account.user_id,
            name: fullTransactionData.account.name,
            type: fullTransactionData.account.type as Account['type'],
            balance: 0,
            currency: (fullTransactionData.account.currency as CurrencyCode) || "USD",
            is_active: fullTransactionData.account.is_active ?? false,
            institution: null,
            account_number: null,
            notes: fullTransactionData.account.description,
            created_at: fullTransactionData.account.created_at ?? new Date().toISOString(),
            updated_at: fullTransactionData.account.updated_at ?? new Date().toISOString(),
          } : undefined,
        };

        setTransaction(transformedTransaction);

        // Fetch accounts from chart_of_accounts for the dropdown
        const { data: coaData, error: coaError } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("is_active", true)
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (coaError) {
          console.error("Error fetching chart_of_accounts for dropdown:", coaError);
          toast.error("Error loading accounts for dropdown: " + coaError.message);
          setAccounts([]);
        } else {
          console.log("[EditPage] Fetched chart_of_accounts data (coaData) for dropdown:", coaData);

          // Transform ChartOfAccount data to Account type for the dropdown
          const transformedCoaDropdownAccounts: Account[] = 
            ((coaData || []) as Database["public"]["Tables"]["chart_of_accounts"]["Row"][]).map(
              (coa: Database["public"]["Tables"]["chart_of_accounts"]["Row"]) => ({
              id: coa.id,
              user_id: coa.user_id,
              name: coa.name,
              type: coa.type as Account['type'], 
              balance: 0, // Default balance
              currency: (coa.currency as CurrencyCode | null) || "USD", // Handle potential null and cast
              is_active: coa.is_active ?? false,
              institution: null, // Not on chart_of_accounts
              account_number: null, // Not on chart_of_accounts
              notes: coa.description, // Map description to notes
              created_at: coa.created_at ?? new Date().toISOString(),
              updated_at: coa.updated_at ?? new Date().toISOString(),
            }));
          console.log("[EditPage] Transformed COA accounts for dropdown:", transformedCoaDropdownAccounts);
          setAccounts(transformedCoaDropdownAccounts);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true);

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
          return <div>Error loading categories</div>;
        }
        // Transform categories data
        const transformedCategories: Category[] = (categoriesData as Database["public"]["Tables"]["categories"]["Row"][] || []).map(cat => ({
            id: cat.id,
            user_id: cat.user_id,
            name: cat.name,
            type: cat.type as Category['type'],
            color: cat.color,
            parent_id: cat.parent_id,
            is_active: cat.is_active ?? false,
            created_at: cat.created_at ?? new Date().toISOString(),
            updated_at: cat.updated_at ?? new Date().toISOString(),
            is_default: cat.is_default ?? false,
        }));
        setCategories(transformedCategories);
      } catch (error) {
        toast.error("Error fetching data");
      }
    };

    fetchData();
  }, [params.id]);

  if (!transaction) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Edit Transaction
          </h2>
          <p className="text-muted-foreground">
            Update your transaction details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm
              initialData={transaction}
              accounts={accounts}
              categories={categories}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
