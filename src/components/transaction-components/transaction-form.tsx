"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type {
  Transaction,
  Category,
  Account,
  TransactionType,
  RecurrenceFrequency,
  TransactionFormData
} from "@/types/financial";

const transactionFormSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters"),
  amount: z.string().transform((val) => parseFloat(val)),
  type: z.enum(["income", "expense", "transfer"] as const),
  category_id: z.string().uuid("Invalid category format").optional(),
  account_id: z.string().uuid("Invalid account format").min(1, "Account is required"),
  date: z.string(),
  notes: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z
    .enum(["daily", "weekly", "monthly", "yearly"] as const)
    .optional(),
  next_occurrence_date: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  accounts: Account[];
  categories: Category[];
}

export function TransactionForm({
  initialData,
  accounts,
  categories,
}: TransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      amount: initialData.amount ?? 0,
      category_id: initialData.category_id || undefined,
      account_id: initialData.account_id || undefined,
      type: initialData.type || "expense",
      date: initialData.date || new Date().toISOString().split("T")[0],
      is_recurring: initialData.is_recurring || false,
      notes: initialData.notes || "",
      recurrence_frequency: initialData.recurrence_frequency || undefined,
      next_occurrence_date: initialData.next_occurrence_date || undefined,
    } : {
      description: "",
      amount: 0,
      type: "expense" as const,
      category_id: undefined,
      account_id: undefined,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      is_recurring: false,
      recurrence_frequency: undefined,
      next_occurrence_date: undefined,
    },
  });

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to create a transaction");
        return;
      }

      // Check if we're updating an existing transaction
      if (initialData?.id) {
        // Update existing transaction
        const { error } = await supabase
          .from("transactions")
          .update({
            description: data.description,
            amount: data.amount,
            type: data.type,
            category_id: data.category_id || null,
            account_id: data.account_id,
            date: data.date,
            notes: data.notes,
            is_recurring: data.is_recurring,
            recurrence_frequency: data.recurrence_frequency,
            next_occurrence_date: data.next_occurrence_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Transaction updated successfully");
      } else {
        // Create new transaction
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          description: data.description,
          amount: data.amount,
          type: data.type,
          category_id: data.category_id || null,
          account_id: data.account_id,
          date: data.date,
          notes: data.notes,
          is_recurring: data.is_recurring,
          recurrence_frequency: data.recurrence_frequency,
          next_occurrence_date: data.next_occurrence_date,
        });

        if (error) throw error;
        toast.success("Transaction created successfully");
      }

      router.push("/dashboard/transactions");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter transaction description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...field}
                  value={field.value?.toString() ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories
                    .filter((category) => category.type === form.watch("type"))
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Add notes (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Recurring Transaction
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Set this as a recurring transaction
                </p>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("is_recurring") && (
          <>
            <FormField
              control={form.control}
              name="recurrence_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_occurrence_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Occurrence</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : initialData
              ? "Update Transaction"
              : "Create Transaction"}
        </Button>
      </form>
    </Form>
  );
}
