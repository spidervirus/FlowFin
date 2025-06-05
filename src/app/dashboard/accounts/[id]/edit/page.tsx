"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import DashboardWrapper from "../../../dashboard-wrapper";
import { BankAccountForm } from "@/components/account-components/bank-account-form";
import { Account } from "@/types/financial";
import type { Database } from "@/types/supabase";

export default function EditAccountPage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyCode[]>([]);

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
        .from("accounts")
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

      // Transform the data to match Account type
      const transformedAccount: Account = {
        ...accountData,
        currency: accountData.currency as CurrencyCode,
        type: accountData.type as Account['type'],
        created_at: accountData.created_at ?? '',
        updated_at: accountData.updated_at ?? '',
      };

      setAccount(transformedAccount);

      // Fetch company settings for currencies
      const { data: settings, error: settingsError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError) {
        toast.error("Error fetching company settings");
        return;
      }

      if (settings?.default_currency) {
        setCurrencies([settings.default_currency as CurrencyCode]);
      }
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
          <h2 className="text-3xl font-bold tracking-tight">Edit Account</h2>
          <p className="text-muted-foreground">
            Update your account information
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <BankAccountForm initialData={account} currencies={currencies} isEditMode={true} />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
