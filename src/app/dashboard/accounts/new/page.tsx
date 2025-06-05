"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankAccountForm } from "@/components/account-components/bank-account-form";
import DashboardWrapper from "../../dashboard-wrapper";
import { Account, CompanySettings, ChartOfAccount } from "@/types/financial";

export default function NewAccountPage() {
  const [currencies, setCurrencies] = useState<CurrencyCode[]>(["USD"]);
  const supabase = createClient();

  const initialDataForForm: Partial<ChartOfAccount> & { 
    balance?: number; 
    currency?: string; 
    institution?: string | null; 
    account_number?: string | null; 
    description?: string | null; 
    is_active?: boolean; 
    parent_id?: string | null; 
  } = {
    name: "",
    type: "asset",
    code: undefined,
    balance: 0,
    currency: currencies[0] || "USD",
    institution: undefined,
    account_number: undefined,
    description: undefined,
    is_active: true,
    parent_id: undefined,
  };

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("You must be logged in to create an account");
          return;
        }

        const { data: settings, error } = await supabase
          .from("company_settings")
          .select("default_currency")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (settings?.default_currency) {
          setCurrencies([settings.default_currency as CurrencyCode]);
        }
      } catch (error) {
        toast.error("Error fetching currencies");
      }
    };

    fetchCurrencies();
  }, []);

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Account</h2>
          <p className="text-muted-foreground">
            Create a new account to track your finances
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <BankAccountForm 
              initialData={initialDataForForm}
              currencies={currencies} 
              isEditMode={false}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
