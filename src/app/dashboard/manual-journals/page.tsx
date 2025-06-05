"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Plus, FileText, Calendar, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  reference_number: string;
  description: string;
  entries: Array<{
    account_id: string;
    description: string;
    debit: number;
    credit: number;
  }>;
  status: "draft" | "posted" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Add interface for raw data from Supabase
interface RawJournalData {
  id: string;
  user_id: string;
  date: string;
  reference_number: string;
  description: string;
  status: "draft" | "posted" | "cancelled";
  created_at: string;
  updated_at: string;
  entries: Array<{
    id: string;
    journal_id: string;
    account_id: string;
    description: string | null;
    debit_amount: number;
    credit_amount: number;
    created_at: string;
    updated_at: string;
  }>;
}

export default function ManualJournalsPage() {
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to view manual journals");
          return;
        }

        // Fetch company settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
          setSettings(null);
        } else if (settingsData) {
          const transformedSettings: CompanySettings = {
            id: settingsData.id,
            user_id: settingsData.user_id,
            company_name: settingsData.company_name ?? "N/A",
            default_currency: settingsData.default_currency ?? "USD",
            address: (settingsData as any).address ?? undefined,
            country: (settingsData as any).country ?? undefined,
            fiscal_year_start: settingsData.fiscal_year_start ?? "",
            industry: (settingsData as any).industry ?? undefined,
            created_at: settingsData.created_at ?? "",
            updated_at: settingsData.updated_at ?? "",
          };
          setSettings(transformedSettings);
        } else {
          setSettings(null);
        }

        // Fetch journals with their entries
        const { data, error } = await supabase
          .from("manual_journals")
          .select(
            `
            *,
            entries:manual_journal_entries(
              id,
              journal_id,
              account_id,
              description,
              debit_amount,
              credit_amount,
              created_at,
              updated_at
            )
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform the data to match the JournalEntry interface
        const transformedJournals: JournalEntry[] = (data || []).map(
          (journal: any) => ({
            id: journal.id,
            user_id: journal.user_id,
            date: journal.date,
            reference_number: journal.reference_number,
            description: journal.description,
            status: journal.status,
            created_at: journal.created_at,
            updated_at: journal.updated_at,
            entries: (journal.entries || []).map((entry: any) => ({
              account_id: entry.account_id,
              description: entry.description || "",
              debit: Number(entry.debit_amount) || 0,
              credit: Number(entry.credit_amount) || 0,
            })),
          }),
        );

        setJournals(transformedJournals);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading manual journals");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatAmount = (amount: number) => {
    if (typeof amount !== "number" || isNaN(amount)) {
      amount = 0;
    }

    if (!settings?.default_currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings.default_currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotals = () => {
    return journals.reduce(
      (acc, journal) => ({
        debit:
          acc.debit +
          journal.entries.reduce((sum, entry) => sum + entry.debit, 0),
        credit:
          acc.credit +
          journal.entries.reduce((sum, entry) => sum + entry.credit, 0),
        count: acc.count + 1,
        draft: acc.draft + (journal.status === "draft" ? 1 : 0),
        posted: acc.posted + (journal.status === "posted" ? 1 : 0),
      }),
      { debit: 0, credit: 0, count: 0, draft: 0, posted: 0 },
    );
  };

  const totals = calculateTotals();

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
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manual Journals</h1>
          <Link href="/dashboard/manual-journals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Journal Entry
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Entries
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.count}</div>
              <p className="text-xs text-muted-foreground">
                {totals.draft} drafts, {totals.posted} posted
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Debits
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(totals.debit)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Credits
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(totals.credit)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Impact</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(totals.debit - totals.credit)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="all">All Entries</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="posted">Posted</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="rounded-lg border">
              <div className="grid grid-cols-1 gap-4 p-4">
                {journals.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No journal entries
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new journal entry.
                    </p>
                    <div className="mt-6">
                      <Link href="/dashboard/manual-journals/new">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          New Journal Entry
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  journals
                    .filter(
                      (journal) =>
                        activeTab === "all" || journal.status === activeTab,
                    )
                    .map((journal) => (
                      <Card
                        key={journal.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  #{journal.reference_number}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {journal.description}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge
                                variant="outline"
                                className={
                                  journal.status === "posted"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {journal.status === "posted"
                                  ? "Posted"
                                  : "Draft"}
                              </Badge>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  Dr:{" "}
                                  {formatAmount(
                                    journal.entries.reduce(
                                      (sum, entry) => sum + entry.debit,
                                      0,
                                    ),
                                  )}
                                </div>
                                <div className="text-sm font-medium">
                                  Cr:{" "}
                                  {formatAmount(
                                    journal.entries.reduce(
                                      (sum, entry) => sum + entry.credit,
                                      0,
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>
                                Date:{" "}
                                {format(new Date(journal.date), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/dashboard/manual-journals/${journal.id}`}
                              >
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
