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

    fetchCompanySettings();
    fetchInvoiceCurrency();
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

      // Update invoice status if payment matches total amount
      if (invoiceId) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("total_amount, status")
          .eq("id", invoiceId)
          .single();

        if (invoice && invoice.total_amount === data.amount) {
          await supabase
            .from("invoices")
            .update({ status: "paid", payment_date: data.payment_date })
            .eq("id", invoiceId);
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