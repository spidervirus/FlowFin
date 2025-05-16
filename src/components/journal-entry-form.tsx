"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Calendar as CalendarIcon, Plus, Trash } from "lucide-react";
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

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ManualJournalEntry {
  id?: string;
  journal_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
  account?: ChartAccount;
}

interface ManualJournal {
  id: string;
  date: string;
  reference_number: string;
  description: string;
  status: "draft" | "posted";
  entries?: ManualJournalEntry[];
  created_at: string;
  updated_at: string;
  user_id: string;
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
    .min(2, "At least two entries are required")
    .refine(
      (entries) => {
        const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredits = entries.reduce(
          (sum, entry) => sum + entry.credit,
          0,
        );
        return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small floating point differences
      },
      {
        message: "Total debits must equal total credits",
      },
    ),
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

interface JournalEntryFormProps {
  initialData?: ManualJournal;
  accounts: ChartAccount[];
  onSubmit: (data: JournalEntryFormValues) => Promise<void>;
}

export function JournalEntryForm({
  initialData,
  accounts,
  onSubmit,
}: JournalEntryFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: initialData
      ? {
          date: new Date(initialData.date),
          reference_number: initialData.reference_number,
          description: initialData.description,
          entries: initialData.entries?.map((entry) => ({
            account_id: entry.account_id,
            description: entry.description || undefined,
            debit: entry.debit_amount,
            credit: entry.credit_amount,
          })) || [
          { account_id: "", description: "", debit: 0, credit: 0 },
          { account_id: "", description: "", debit: 0, credit: 0 },
        ],
        }
      : {
          date: new Date(),
          reference_number: "",
          description: "",
          entries: [
            { account_id: "", description: "", debit: 0, credit: 0 },
            { account_id: "", description: "", debit: 0, credit: 0 },
          ],
        },
  });

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

  const handleSubmit = async (data: JournalEntryFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving journal entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
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
                        date > new Date() || date < new Date("1900-01-01")
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
                  <Input placeholder="Enter reference number" {...field} />
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
                <Textarea placeholder="Enter journal entry description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Journal Entries</h3>
            <Button type="button" variant="outline" onClick={addEntry}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>

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
                            <SelectItem key={account.id} value={account.id}>
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
                        <Input placeholder="Entry description" {...field} />
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
                            field.onChange(parseFloat(e.target.value) || 0)
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
                            field.onChange(parseFloat(e.target.value) || 0)
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

          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              Total Debits: $
              {form
                .watch("entries")
                .reduce((sum, entry) => sum + entry.debit, 0)
                .toFixed(2)}
              <br />
              Total Credits: $
              {form
                .watch("entries")
                .reduce((sum, entry) => sum + entry.credit, 0)
                .toFixed(2)}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : initialData
              ? "Update Journal Entry"
              : "Create Journal Entry"}
        </Button>
      </form>
    </Form>
  );
} 