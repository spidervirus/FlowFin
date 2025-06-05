import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardWrapper from "@/app/dashboard/dashboard-wrapper";
import { JournalEntryForm } from "@/components/journal-entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditJournalEntryPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  // Fetch journal entry
  const { data: journal, error: journalError } = await supabase
    .from("manual_journals")
    .select("*, entries:manual_journal_entries(*)")
    .eq("id", params.id)
    .single();

  if (journalError) {
    console.error("Error fetching journal:", journalError);
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="p-4">
          <p className="text-red-500">Error loading journal entry</p>
        </div>
      </DashboardWrapper>
    );
  }

  if (!journal) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="p-4">
          <p>Journal entry not found</p>
        </div>
      </DashboardWrapper>
    );
  }

  // Check if journal is already posted
  if (journal.status === "posted") {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="p-4">
          <p>This journal entry has already been posted and cannot be edited</p>
        </div>
      </DashboardWrapper>
    );
  }

  // Fetch active accounts
  const { data: accounts, error: accountsError } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("code");

  if (accountsError) {
    console.error("Error fetching accounts:", accountsError);
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="p-4">
          <p className="text-red-500">Error loading accounts</p>
        </div>
      </DashboardWrapper>
    );
  }

  async function updateJournal(formData: any) {
    "use server";
    
    const supabase = createServerComponentClient({ cookies });
    
    const { data: session } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    // Start a transaction
    const { data: journal, error: journalError } = await supabase
      .from("manual_journals")
      .update({
        date: formData.date.toISOString(),
        reference_number: formData.reference_number,
        description: formData.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (journalError) {
      throw new Error("Failed to update journal");
    }

    // Delete existing entries
    const { error: deleteError } = await supabase
      .from("manual_journal_entries")
      .delete()
      .eq("journal_id", params.id);

    if (deleteError) {
      throw new Error("Failed to delete existing entries");
    }

    // Insert new entries
    const { error: entriesError } = await supabase
      .from("manual_journal_entries")
      .insert(
        formData.entries.map((entry: any) => ({
          journal_id: params.id,
          account_id: entry.account_id,
          description: entry.description || null,
          debit_amount: entry.debit,
          credit_amount: entry.credit,
        }))
      );

    if (entriesError) {
      throw new Error("Failed to insert new entries");
    }

    redirect("/dashboard/manual-journals");
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Journal Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <JournalEntryForm
              initialData={journal}
              accounts={accounts}
              onSubmit={updateJournal}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
