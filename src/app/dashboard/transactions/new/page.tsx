"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from "@/components/transaction-components/transaction-form";
import DashboardWrapper from "../../dashboard-wrapper";
import { Account, Category, ChartOfAccount } from "@/types/financial";
import type { Database } from "@/types/supabase";

export default function NewTransactionPage() {
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
          toast.error("You must be logged in to create a transaction");
          return;
        }

        // Fetch accounts from chart_of_accounts
        const { data: coaData, error: coaError } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (coaError) throw coaError;
        console.log("[NewPage] Fetched chart_of_accounts data (coaData):", coaData);

        const typedCoaData = (coaData || []) as Database['public']['Tables']['chart_of_accounts']['Row'][];

        const transformedAccounts: Account[] = typedCoaData.map(
          (coa: Database['public']['Tables']['chart_of_accounts']['Row']) => {
            // Added a log inside the map to inspect individual coa object
            // console.log("[NewPage] Mapping COA item:", coa);
            return {
              id: coa.id,
              user_id: coa.user_id,
              name: coa.name,
              type: coa.type as Account['type'],
              balance: 0,
              currency: (coa.currency as CurrencyCode | null) || "USD", // Ensure null is handled before ||
              is_active: coa.is_active ?? false,
              institution: null,
              account_number: null,
              notes: coa.description,
              created_at: coa.created_at ?? new Date().toISOString(),
              updated_at: coa.updated_at ?? new Date().toISOString(),
            };
          });
        console.log("[NewPage] Transformed accounts from COA:", transformedAccounts);

        setAccounts(transformedAccounts);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        
        // Transform Category data
        const transformedCategories: Category[] = (categoriesData as Database['public']['Tables']['categories']['Row'][] || []).map((cat) => ({
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
  }, []);

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Transaction</h2>
          <p className="text-muted-foreground">
            Create a new transaction to track your finances
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm accounts={accounts} categories={categories} />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
