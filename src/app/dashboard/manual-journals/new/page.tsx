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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  default_currency: string;
  address?: string;
  country: string;
  fiscal_year_start: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

const journalEntrySchema = z.object({
  date: z.date(),
  reference_number: z.string().min(1, "Reference number is required"),
  description: z.string().min(1, "Description is required"),
  entries: z
    .array(
      z.object({
        account_id: z.string().min(1, "Account is required"),
        description: z.string().optional(),
        debit: z.number().min(0),
        credit: z.number().min(0),
      }),
    )
    .min(2, "At least two entries are required"),
});

type JournalEntryForm = z.infer<typeof journalEntrySchema>;

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  const form = useForm<JournalEntryForm>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date(),
      reference_number: "",
      description: "",
      entries: [
        { account_id: "", description: "", debit: 0, credit: 0 },
        { account_id: "", description: "", debit: 0, credit: 0 },
      ],
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to create journal entries");
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
            router.push("/dashboard/settings");
            return;
          }
          throw settingsError;
        }

        setSettings(settingsData);

        // Generate next reference number
        const { data: lastJournal, error: journalError } = await supabase
          .from("manual_journals")
          .select("reference_number")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!journalError && lastJournal) {
          const lastNumber = parseInt(
            lastJournal.reference_number.split("-")[1] || "0",
          );
          const nextNumber = (lastNumber + 1).toString().padStart(5, "0");
          form.setValue("reference_number", `JE-${nextNumber}`);
        } else {
          form.setValue("reference_number", "JE-00001");
        }

        // Fetch accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from("chart_of_accounts")
          .select("id, code, name, type")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("code", { ascending: true });

        if (accountsError) {
          if (accountsError.code === "PGRST116") {
            toast.error("Chart of accounts not found. Please contact support.");
          } else if (accountsError.code === "42P01") {
            toast.error("Database setup incomplete. Please contact support.");
          } else {
            toast.error(`Error loading accounts: ${accountsError.message}`);
          }
          throw accountsError;
        }

        if (!accountsData || accountsData.length === 0) {
          toast.error(
            "No accounts found. Please set up your chart of accounts first.",
          );
          router.push("/dashboard/chart-of-accounts");
          return;
        }

        setAccounts(accountsData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, form]);

  const addEntry = () => {
    const entries = form.getValues("entries");
    form.setValue("entries", [
      ...entries,
      { account_id: "", description: "", debit: 0, credit: 0 },
    ]);
  };

  const removeEntry = (index: number) => {
    const entries = form.getValues("entries");
    if (entries.length > 2) {
      form.setValue(
        "entries",
        entries.filter((_, i) => i !== index),
      );
    }
  };

  const onSubmit = async (data: JournalEntryForm) => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to create journal entries");
        return;
      }

      // Validate debits equal credits
      const totalDebits = data.entries.reduce(
        (sum, entry) => sum + entry.debit,
        0,
      );
      const totalCredits = data.entries.reduce(
        (sum, entry) => sum + entry.credit,
        0,
      );

      if (totalDebits !== totalCredits) {
        toast.error("Total debits must equal total credits");
        return;
      }

      const { error } = await supabase.from("manual_journals").insert({
        user_id: user.id,
        date: data.date.toISOString(),
        reference_number: data.reference_number,
        description: data.description,
        entries: data.entries,
        status: "draft",
      });

      if (error) throw error;

      toast.success("Journal entry created successfully");
      router.push("/dashboard/manual-journals");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error creating journal entry");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/manual-journals">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">New Journal Entry</h1>
              {settings && (
                <p className="text-sm text-muted-foreground">
                  {settings.company_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" form="journal-entry-form" disabled={loading}>
              Save as Draft
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form
            id="journal-entry-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Entry Details</CardTitle>
                <CardDescription>
                  Enter the basic information for this journal entry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter reference number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter journal entry description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Journal Entries</CardTitle>
                <CardDescription>
                  Add the debit and credit entries for this journal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch("entries").map((entry, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                  >
                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`entries.${index}.account_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {account.code} - {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`entries.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Entry description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FormField
                        control={form.control}
                        name={`entries.${index}.debit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FormField
                        control={form.control}
                        name={`entries.${index}.credit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end justify-end h-full">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => removeEntry(index)}
                        disabled={form.watch("entries").length <= 2}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button type="button" variant="outline" onClick={addEntry}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Total Debits:{" "}
                    {formatAmount(
                      form
                        .watch("entries")
                        .reduce((sum, entry) => sum + entry.debit, 0),
                    )}
                    <br />
                    Total Credits:{" "}
                    {formatAmount(
                      form
                        .watch("entries")
                        .reduce((sum, entry) => sum + entry.credit, 0),
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </DashboardWrapper>
  );
}
