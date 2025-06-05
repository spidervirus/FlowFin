"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import DashboardWrapper from "../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  FileText,
  Building2,
  ArrowUpDown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

type ChartOfAccount = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  default_currency: string;
  address?: string;
  country?: string;
  fiscal_year_start: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/signin");
          return;
        }

        // Fetch company settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
          if (settingsError.code === "PGRST116") {
            toast.error(
              "Company settings not found. Please complete your company setup.",
            );
            return;
          }
          throw settingsError;
        }

        if (settingsData) {
          const transformedSettings: CompanySettings = {
            id: settingsData.id,
            user_id: settingsData.user_id,
            company_name: settingsData.company_name ?? "N/A",
            default_currency: settingsData.default_currency ?? "USD",
            address: settingsData.address ?? undefined,
            country: (settingsData as any).country ?? undefined,
            fiscal_year_start: settingsData.fiscal_year_start ?? "",
            industry: settingsData.industry ?? undefined,
            created_at: settingsData.created_at ?? "",
            updated_at: settingsData.updated_at ?? "",
          };
          setSettings(transformedSettings);
        } else {
          setSettings(null);
        }

        // Fetch accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("code", { ascending: true });

        if (accountsError) throw accountsError;

        const transformedAccounts = (accountsData || []).map(acc => {
          const validTypes = ["asset", "liability", "equity", "revenue", "expense"];
          const accountType = validTypes.includes(acc.type) 
                              ? acc.type as ChartOfAccount['type'] 
                              : "asset" as ChartOfAccount['type'];
          return {
            ...acc,
            id: acc.id,
            user_id: acc.user_id,
            code: acc.code,
            name: acc.name,
            type: accountType,
            description: acc.description ?? "",
            parent_id: acc.parent_id ?? undefined,
            is_active: acc.is_active ?? true,
            created_at: acc.created_at ?? "",
            updated_at: acc.updated_at ?? "",
          } as ChartOfAccount;
        });
        setAccounts(transformedAccounts);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const filteredAccounts = accounts.filter((account) => {
    if (activeTab === "all") return true;
    return account.type === activeTab;
  });

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chart of Accounts</h1>
            <p className="text-muted-foreground">
              Manage your accounting structure
            </p>
          </div>
          <Link href="/dashboard/chart-of-accounts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="asset">Assets</TabsTrigger>
            <TabsTrigger value="liability">Liabilities</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.type}</Badge>
                  </TableCell>
                  <TableCell>{account.description || "-"}</TableCell>
                  <TableCell>
                    <Switch checked={account.is_active} disabled />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(
                          `/dashboard/chart-of-accounts/${account.id}`,
                        )
                      }
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardWrapper>
  );
}
