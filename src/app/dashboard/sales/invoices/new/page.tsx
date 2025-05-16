"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { generateInvoiceNumber } from "@/lib/utils/invoices";
import { Database } from "@/lib/supabase/database.types";
import { useToast } from "@/components/ui/use-toast";

type Tables = Database["public"]["Tables"];
type Invoice = Tables["invoices"]["Row"];
type InvoiceInsert = Tables["invoices"]["Insert"];
type Customer = Tables["customers"]["Row"];
type InventoryItem = {
  id: string;
  name: string;
  unit_price: number;
};

const supabase = createClientComponentClient<Database>();

const invoiceFormSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  date: z.string(),
  due_date: z.string(),
  customer_id: z.string().min(1, "Customer is required"),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit_price: z.number().min(0, "Unit price must be greater than or equal to 0"),
    amount: z.number().min(0, "Amount must be greater than or equal to 0")
  })).min(1, "At least one item is required"),
  subtotal: z.number().min(0),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_amount: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "credit", "proforma"]).default("draft"),
  notes: z.string().optional(),
  delivery_tracking_id: z.string().optional(),
  shipping_address: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      date: new Date().toISOString().split("T")[0],
      due_date: new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString()
        .split("T")[0],
      customer_id: "",
      items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
      subtotal: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 0,
      status: "draft",
      notes: "",
      delivery_tracking_id: "",
      shipping_address: "",
    }
  });

  const calculateItemAmount = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const amount = item.quantity * item.unit_price;
    form.setValue(`items.${index}.amount`, amount);
    calculateSubtotal();
  };

  const calculateSubtotal = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    form.setValue("subtotal", subtotal);
    calculateTotal();
  };

  const calculateTotal = () => {
    const subtotal = form.getValues("subtotal");
    const taxRate = form.getValues("tax_rate") || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    
    form.setValue("tax_amount", taxAmount);
    form.setValue("total_amount", total);
  };

  const addItem = () => {
    const items = form.getValues("items");
    form.setValue("items", [
      ...items,
      { description: "", quantity: 1, unit_price: 0, amount: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    form.setValue(
      "items",
      items.filter((_, i) => i !== index)
    );
    calculateSubtotal();
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("[DEBUG] No user found, redirecting to sign-in.");
          router.push("/sign-in");
          return;
        }
        console.log("[DEBUG] User ID:", user.id);

        // Get company settings
        const { data: settings } = await supabase
          .from("company_settings")
          .select("default_currency")
          .eq("user_id", user.id)
          .single();

        if (settings?.default_currency) {
          setCurrency(settings.default_currency as CurrencyCode);
        }

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(supabase);
        form.setValue("invoice_number", invoiceNumber);

        // Fetch active customers
        console.log("[DEBUG] Fetching customers for user_id:", user.id, "and is_active: true");
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("company_name");

        if (customersError) {
          console.error("[DEBUG] Supabase customers fetch error:", customersError);
          throw customersError;
        }
        
        console.log("[DEBUG] Fetched customersData:", customersData);

        setCustomers(customersData || []);

        // Ensure form's customer_id is reset if no customers or not auto-selecting
        // And ensure selectedCustomer state is also cleared
        form.setValue("customer_id", "");
        setSelectedCustomer(null);

      } catch (error) {
        console.error("[DEBUG] Error in fetchData (NewInvoicePage):", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchInventoryItems() {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, unit_price");
      if (!error) setInventoryItems(data || []);
    }
    fetchInventoryItems();
  }, []);

  const watchItems = form.watch("items");
  const watchTaxRate = form.watch("tax_rate");

  useEffect(() => {
    const items = form.getValues("items") || [];
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = form.getValues("tax_rate") || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    form.setValue("subtotal", subtotal);
    form.setValue("tax_amount", taxAmount);
    form.setValue("total_amount", total);
  }, [watchItems, watchTaxRate, form]);

  const onCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create an invoice",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const mainInvoiceData: Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at' | 'items'> & { items?: any } = {
        user_id: user.id,
        customer_id: data.customer_id,
        invoice_number: data.invoice_number,
        date: data.date,
        due_date: data.due_date,
        subtotal: data.subtotal,
        tax_rate: data.tax_rate,
        tax_amount: data.tax_amount,
        total_amount: data.total_amount,
        status: data.status,
        notes: data.notes || null,
        delivery_tracking_id: data.delivery_tracking_id || null,
        shipping_address: data.shipping_address || null,
      };

      const { data: insertedInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert(mainInvoiceData)
        .select()
        .single();

      if (invoiceError || !insertedInvoice) {
        console.error("Error inserting invoice:", invoiceError);
        throw invoiceError || new Error("Failed to insert invoice or get inserted data.");
      }

      console.log("[DEBUG] Inserted Invoice ID:", insertedInvoice.id);

      if (data.items && data.items.length > 0) {
        const invoiceItemsToInsert = data.items.map(item => ({
          invoice_id: insertedInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          user_id: user.id,
        }));

        console.log("[DEBUG] Invoice items to insert:", invoiceItemsToInsert);

        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(invoiceItemsToInsert);

        if (itemsError) {
          console.error("Error inserting invoice items:", itemsError);
          await supabase.from("invoices").delete().eq("id", insertedInvoice.id);
          throw itemsError;
        }
      }

      toast({
        title: "Success",
        description: "Invoice created successfully"
      });

      router.push("/dashboard/sales/invoices");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="New Invoice"
        text="Create a new invoice"
      >
        <Link href="/dashboard/sales/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </DashboardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Enter the details for your new invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          onCustomerSelect(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company_name}
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
                      <FormLabel>Invoice Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select invoice status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="credit">Credit Note</SelectItem>
                          <SelectItem value="proforma">Proforma</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label>Selected Customer</Label>
                    <p className="text-sm font-medium">{selectedCustomer.company_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedCustomer.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Billing Address</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.billing_address_line1 || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Add items to your invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {watchItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-4">
                      <FormItem>
                        <FormLabel>Select Inventory Item</FormLabel>
                        <Select
                          onValueChange={(inventoryItemId) => {
                            const selected = inventoryItems.find(i => i.id === inventoryItemId);
                            if (selected) {
                              form.setValue(`items.${index}.description`, selected.name);
                              form.setValue(`items.${index}.unit_price`, selected.unit_price);
                              calculateItemAmount(index);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item from inventory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inventoryItems.map((invItem) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                {invItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted/50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(Number(e.target.value));
                                  calculateItemAmount(index);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(Number(e.target.value));
                                  calculateItemAmount(index);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                value={typeof field.value === 'number' ? field.value.toFixed(2) : '0.00'}
                                disabled
                                className="bg-muted"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1 pt-8">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeItem(index)}
                        disabled={watchItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>

                <div className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>
                        {new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
                          style: "currency",
                          currency: currency,
                        }).format(form.watch("subtotal"))}
                      </span>
                    </div>

                    <FormField
                      control={form.control}
                      name="tax_rate"
                      render={({ field }) => (
                        <div className="flex justify-between items-center gap-4">
                          <FormLabel className="text-sm text-muted-foreground">Tax Rate (%):</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-32"
                              {...field}
                              onChange={(e) => {
                                field.onChange(Number(e.target.value));
                                calculateTotal();
                              }}
                            />
                          </FormControl>
                        </div>
                      )}
                    />

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax Amount:</span>
                      <span>
                        {new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
                          style: "currency",
                          currency: currency,
                        }).format(form.watch("tax_amount"))}
                      </span>
                    </div>

                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>
                        {new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
                          style: "currency",
                          currency: currency,
                        }).format(form.watch("total_amount"))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="shipping_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter shipping address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="delivery_tracking_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Tracking ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tracking ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes or payment instructions"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/sales/invoices")}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Invoice
            </Button>
          </div>
        </form>
      </Form>
    </DashboardShell>
  );
}