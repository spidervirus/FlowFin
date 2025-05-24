"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormValues, paymentSchema, PAYMENT_METHODS } from "@/types/payments";
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
import { Textarea } from "@/components/ui/textarea";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { CURRENCY_CONFIG, getUserCurrency, CurrencyCode } from "@/lib/utils";
import { useEffect, useState } from "react";

// Use the generated Database type directly for TransactionInsert
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

interface PaymentFormProps {
  invoiceId?: string;
  defaultValues?: Partial<PaymentFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  invoiceId,
  defaultValues,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>("USD");
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const { data: settings, error } = await supabase
          .from("company_settings")
          .select("default_currency")
          .single();

        if (error) throw error;
        if (settings?.default_currency) {
          setDefaultCurrency(settings.default_currency as CurrencyCode);
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
      }
    };

    const fetchInvoiceCurrency = async () => {
      if (!invoiceId) return;
      try {
        const { data: invoiceData, error: fetchInvoiceError } = await supabase
          .from("invoices")
          .select("currency")
          .eq("id", invoiceId)
          .single();

        if (fetchInvoiceError && fetchInvoiceError.code !== 'PGRST116') {
          console.error("Error fetching invoice currency details:", fetchInvoiceError);
        } else if (invoiceData && 'currency' in invoiceData && invoiceData.currency) {
          setDefaultCurrency(invoiceData.currency as CurrencyCode);
        }
      } catch (error) {
        console.error("Error fetching invoice currency:", error);
      }
    };

    const fetchDefaultAccount = async (userId: string) => {
      try {
        const { data: accounts, error } = await supabase
          .from("accounts")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (error) throw error;
        if (accounts && accounts.length > 0) {
          setDefaultAccountId(accounts[0].id);
        }
      } catch (error) {
        console.error("Error fetching default account:", error);
        toast.error("Failed to load default account for transactions.");
      }
    };

    fetchCompanySettings();
    fetchInvoiceCurrency();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchDefaultAccount(user.id);
      }
    });
  }, [invoiceId, supabase]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: invoiceId || "",
      payment_date: new Date().toISOString().split("T")[0],
      amount: 0,
      currency_code: defaultCurrency,
      payment_method: "bank_transfer",
      ...defaultValues,
    },
  });

  useEffect(() => {
    form.setValue("currency_code", defaultCurrency);
  }, [defaultCurrency, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const paymentDataToInsert: {
        invoice_id: string;
        payment_date: string;
        amount: number;
        payment_method: string;
        notes?: string | null;
        transaction_id?: string | null;
        user_id: string;
      } = {
        invoice_id: data.invoice_id,
        payment_date: data.payment_date,
        amount: Number(data.amount) || 0,
        payment_method: data.payment_method,
        notes: data.notes || null,
        transaction_id: data.transaction_id || null,
        user_id: user.id,
      };

      // Insert payment record
      const { data: payment, error: paymentError } = await supabase
        .from("invoice_payments")
        .insert([paymentDataToInsert])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update invoice status if payment matches total amount and create income transaction
      if (invoiceId) {
        const { data: invoiceData, error: fetchInvoiceError } = await supabase
          .from("invoices")
          .select("total_amount, status, currency")
          .eq("id", invoiceId)
          .single();

        if (fetchInvoiceError) {
           console.error("Error fetching invoice after payment:", fetchInvoiceError);
           // Continue processing even if fetching invoice fails, payment is recorded.
        } else if (invoiceData) { // Check if invoiceData exists and is not null
           // Access properties only after confirming invoiceData exists
           if (invoiceData.total_amount !== undefined && invoiceData.currency !== undefined) {
             if (invoiceData.total_amount === data.amount) {
              await supabase
                .from("invoices")
                .update({ status: "paid", payment_date: data.payment_date })
                .eq("id", invoiceId);
             }

             // Create a corresponding income transaction
             // Use the fetched default account ID
             const incomeTransaction: TransactionInsert = {
               user_id: user.id,
               amount: Number(data.amount) || 0,
               type: 'income',
               date: data.payment_date,
               description: `Payment for Invoice ${invoiceId}`,
               account_id: defaultAccountId!, // Use the default account ID (asserting non-null as per DB type)
               // currency field is NOT present in the transactions table insert type according to database.types.ts
               // category_id: 'income_category_id',
             };

             // Only insert transaction if a default account ID was successfully fetched
             if (defaultAccountId) {
               const { error: transactionError } = await supabase
                 .from("transactions")
                 .insert([incomeTransaction]); // Insert as an array

               if (transactionError) {
                 console.error("Error creating income transaction for payment:", transactionError);
                 toast.error("Failed to create income transaction for payment");
               }
             } else {
                console.error("Default account ID not available for transaction insertion.");
                toast.error("Failed to create income transaction: Default account not found.");
             }
           }
        }
      }

      toast.success("Payment recorded successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency">
                      {field.value && CURRENCY_CONFIG[field.value as CurrencyCode] && 
                        `${CURRENCY_CONFIG[field.value as CurrencyCode].symbol} - ${CURRENCY_CONFIG[field.value as CurrencyCode].name}`}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      {config.symbol} - {config.name}
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
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.replace("_", " ").toUpperCase()}
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
          name="reference_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bank_account"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Account</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="check_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check Number</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Record Payment</Button>
        </div>
      </form>
    </Form>
  );
} 