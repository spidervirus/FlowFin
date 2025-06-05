"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import DashboardWrapper from "../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/types/supabase";

type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type ManualJournal = Database["public"]["Tables"]["manual_journals"]["Row"];

interface JournalEntry extends Omit<ManualJournal, "id"> {
  id: string;
  entries: Array<{
    account_id: string;
    description: string;
    debit: number;
    credit: number;
  }>;
}

interface RawJournalData extends Omit<ManualJournal, 'entries' /* if 'entries' exists on ManualJournal with a conflicting type */ > {
  // Explicitly list all fields from ManualJournal that are selected by '*' in the query
  // and ensure their types match ManualJournal's definition.
  id: string; // from ManualJournal
  user_id: string; // from ManualJournal
  date: string; // from ManualJournal
  reference_number: string | null; // from ManualJournal
  description: string | null; // from ManualJournal
  status: "draft" | "posted"; // from ManualJournal, ensure this matches its actual type
  created_at: string; // from ManualJournal
  updated_at: string; // from ManualJournal
  // This 'entries' comes from the relational join in the query
  entries: ManualJournalEntry[]; 
}

interface ManualJournalEntry {
  id: string;
  journal_id: string;
  account_id: string;
  description: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  created_at: string;
  updated_at: string;
}

export default function JournalEntryPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [accounts, setAccounts] = useState<Record<string, Account>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to view journal entries");
          return;
        }

        // Fetch journal entry with its entries
        const { data: journalData, error: journalError } = await supabase
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
          .eq("id", params.id)
          .single();

        if (journalError) throw journalError;

        if (!journalData) {
          return null;
        }

        // Transform the data to match the JournalEntry interface
        const transformedJournal: JournalEntry = {
          id: journalData.id,
          user_id: journalData.user_id,
          date: journalData.date,
          reference_number: journalData.reference_number,
          description: journalData.description,
          status: journalData.status,
          created_at: journalData.created_at,
          updated_at: journalData.updated_at,
          entries: ((journalData as any).entries || []).map((entry: ManualJournalEntry) => ({
            account_id: entry.account_id,
            description: entry.description || "",
            debit: Number(entry.debit_amount) || 0,
            credit: Number(entry.credit_amount) || 0,
          })),
        };

        // Fetch accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("user_id", user.id);

        if (accountsError) throw accountsError;

        // Create accounts lookup object
        const accountsLookup = (accountsData || []).reduce(
          (acc: Record<string, Account>, accountRaw: any) => {
            const validTypes = ["asset", "liability", "equity", "revenue", "expense"] as const;
            type AccountTypeEnum = typeof validTypes[number];
            
            let validatedAccountType: AccountTypeEnum = "asset";
            if (accountRaw.type && validTypes.includes(accountRaw.type as any)) {
              validatedAccountType = accountRaw.type as AccountTypeEnum;
            }
            
            const transformedAccount: Account = {
              id: accountRaw.id,
              user_id: accountRaw.user_id,
              code: accountRaw.code,
              name: accountRaw.name,
              type: validatedAccountType,
              description: accountRaw.description ?? "",
              parent_id: accountRaw.parent_id ?? undefined,
              is_active: accountRaw.is_active ?? true,
              created_at: accountRaw.created_at ?? "",
              updated_at: accountRaw.updated_at ?? "",
              currency: accountRaw.currency ?? "USD",
            };
            acc[transformedAccount.id] = transformedAccount;
            return acc;
          },
          {},
        );

        setJournal(transformedJournal);
        setAccounts(accountsLookup);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading journal entry");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  const handlePost = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("manual_journals")
        .update({ status: "posted" })
        .eq("id", params.id);

      if (error) throw error;

      setJournal((prev) => (prev ? { ...prev, status: "posted" } : null));
      toast.success("Journal entry posted successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error posting journal entry");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!journal) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Journal entry not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The journal entry you're looking for doesn't exist or has been
            deleted.
          </p>
          <Link href="/dashboard/manual-journals" className="mt-6">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manual Journals
            </Button>
          </Link>
        </div>
      </DashboardWrapper>
    );
  }

  const totalDebits = journal.entries.reduce(
    (sum, entry) => sum + entry.debit,
    0,
  );
  const totalCredits = journal.entries.reduce(
    (sum, entry) => sum + entry.credit,
    0,
  );

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/manual-journals">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                Journal Entry #{journal.reference_number}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Created on{" "}
                {format(new Date(journal.created_at), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {journal.status === "draft" && (
              <>
                <Link href={`/dashboard/manual-journals/${journal.id}/edit`}>
                  <Button variant="outline">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button onClick={handlePost} disabled={loading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Post Entry
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Entry Details</CardTitle>
              <CardDescription>
                Basic information about this journal entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  variant="outline"
                  className={
                    journal.status === "posted"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  {journal.status === "posted" ? "Posted" : "Draft"}
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Date</span>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(journal.date), "MMMM d, yyyy")}
                </div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Description</span>
                <span className="text-sm text-right">
                  {journal.description}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entry Summary</CardTitle>
              <CardDescription>Overview of debits and credits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Total Debits</span>
                <span className="text-sm font-medium">
                  ${totalDebits.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Total Credits</span>
                <span className="text-sm font-medium">
                  ${totalCredits.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Difference</span>
                <span
                  className={`text-sm font-medium ${totalDebits === totalCredits ? "text-green-600" : "text-red-600"}`}
                >
                  ${Math.abs(totalDebits - totalCredits).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>
              Detailed list of all entries in this journal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal.entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {accounts[entry.account_id]?.code} -{" "}
                      {accounts[entry.account_id]?.name}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">
                      ${entry.debit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${entry.credit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="font-medium">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${totalDebits.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${totalCredits.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
