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
import { ChartOfAccount } from "@/types/financial";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  type: z.enum([
    "asset", "liability", "equity", "revenue", "expense",
    "checking", "savings", "credit", "investment", "cash", "other"
  ]),
  code: z.string().optional(),
  balance: z.coerce.number().default(0),
  currency: z.string().min(3, { message: "Currency code is required." }),
  institution: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  parent_id: z.string().uuid().nullable().optional(),
});

export function BankAccountForm({
  initialData,
  currencies,
  isEditMode,
}: {
  initialData?: Partial<ChartOfAccount> & { 
    balance?: number; 
    currency?: string;
    institution?: string | null;
    account_number?: string | null;
    notes?: string | null;
  };
  currencies: string[];
  isEditMode: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "asset",
      code: initialData?.code || undefined,
      balance: initialData?.balance || 0,
      currency: initialData?.currency || currencies[0] || "USD",
      institution: initialData?.institution || undefined,
      account_number: initialData?.account_number || undefined,
      description: initialData?.description || initialData?.notes || undefined,
      is_active: initialData?.is_active ?? true,
      parent_id: initialData?.parent_id || undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to manage accounts");
        setLoading(false);
        return;
      }

      const accountPayload = {
        name: values.name,
        type: values.type as ChartOfAccount['type'],
        code: values.code || null,
        description: values.description || null,
        is_active: values.is_active,
        parent_id: values.parent_id || null,
        currency: values.currency,
        institution: values.institution || null,
        account_number: values.account_number || null,
        user_id: user.id,
      };
      
      let finalPayload: any = accountPayload;
      if (typeof values.balance === 'number') {
        finalPayload = { ...accountPayload, balance: values.balance };
      }

      if (isEditMode && initialData?.id) {
        const { error } = await supabase
          .from("chart_of_accounts")
          .update({ ...finalPayload, updated_at: new Date().toISOString() })
          .eq("id", initialData.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Account updated successfully");
      } else {
        const { error } = await supabase
          .from("chart_of_accounts")
          .insert({ 
            ...finalPayload, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          });

        if (error) throw error;
        toast.success("Account created successfully");
      }

      router.push("/dashboard/accounts");
      router.refresh();
    } catch (error) {
      console.error("Error saving account:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save account";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Chase Checking, Main Savings" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Code (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="E.g., 1010, ASSET-CHK" {...field} value={field.value ?? ''} />
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
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="checking">Checking (Asset)</SelectItem>
                  <SelectItem value="savings">Savings (Asset)</SelectItem>
                  <SelectItem value="credit">Credit Card (Liability)</SelectItem>
                  <SelectItem value="cash">Cash (Asset)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Balance</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                Enter the current balance or opening balance.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((currencyCode) => (
                    <SelectItem key={currencyCode} value={currencyCode}>
                      {currencyCode}
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
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Financial Institution (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Bank of America" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Last 4 digits or full number" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., Primary checking account, emergency fund"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Inactive accounts won't be available for new transactions.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (isEditMode ? "Saving Changes..." : "Creating Account...") : (isEditMode ? "Save Changes" : "Create Account")}
        </Button>
      </form>
    </Form>
  );
} 