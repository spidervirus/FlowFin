"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import DashboardWrapper from "../../../dashboard-wrapper";
import { ChartOfAccountForm } from "@/components/account-components/chart-of-account-form";
import { ChartOfAccount } from "@/types/financial";

export default function EditChartOfAccountPage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<ChartOfAccount | null>(null);
  const [parentAccounts, setParentAccounts] = useState<ChartOfAccount[]>([]);

  const supabase = createClient();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to edit accounts");
        return;
      }

      // Fetch account data
      const { data: accountData, error: accountError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (accountError) {
        toast.error("Error fetching account");
        return;
      }

      if (!accountData) {
        toast.error("Account not found");
        return;
      }

      setAccount(accountData as ChartOfAccount);

      // Fetch potential parent accounts (excluding the current account and its children)
      const { data: parentAccountsData, error: parentAccountsError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user.id)
        .neq("id", params.id)
        .is("parent_id", null)
        .order("code");

      if (parentAccountsError) {
        toast.error("Error fetching parent accounts");
        return;
      }

      setParentAccounts(parentAccountsData as ChartOfAccount[] || []);
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!account) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">Account not found</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Chart of Account</h2>
          <p className="text-muted-foreground">
            Update your chart of account information
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ChartOfAccountForm initialData={account} parentAccounts={parentAccounts} />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
} 