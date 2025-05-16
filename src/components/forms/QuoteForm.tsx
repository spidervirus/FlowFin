"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { generateQuoteNumber } from "@/lib/utils/quotes";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Customer } from "@/types/sales";

const UNLINKED_ITEM_SELECT_VALUE = "__UNLINKED_ITEM__"; // Define the constant

// Define Zod schema and types locally
const quoteFormItemSchema = z.object({
  id: z.string().uuid().optional(), // For existing items during edit
  item_id: z.string().uuid().optional(), // Link to predefined Item, no longer nullable, just optional
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  // amount is calculated, not part of form schema for item entry
});

export type QuoteFormItemValues = z.infer<typeof quoteFormItemSchema>;

const quoteFormSchema = z.object({
  quote_number: z.string().optional(), // Will be auto-generated if empty
  customer_id: z.string().uuid("Invalid customer").min(1, "Customer is required"),
  quote_date: z.date({ required_error: "Quote date is required." }),
  expiry_date: z.date().nullable().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'rejected', 'expired', 'invoiced', 'paid', 'void', 'archived']),
  items: z.array(quoteFormItemSchema).min(1, "At least one item is required"),
  terms: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  template_id: z.string().uuid().nullable().optional(),
  tax_rate: z.number().min(0).max(100).nullable().optional(),
  discount_rate: z.number().min(0).max(100).nullable().optional(),
  // Calculated fields (subtotal, tax_amount, discount_amount, total) are not part of the form schema
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

type QuoteTemplate = Database["public"]["Tables"]["quote_templates"]["Row"];
// type PredefinedItem = Database["public"]["Tables"]["items"]["Row"]; // Commented out: Needs correct type path or types regeneration

export function QuoteForm({
  onSubmit,
  defaultValues,
  isSubmitting = false
}: {
  onSubmit: (data: QuoteFormValues) => void;
  defaultValues?: Partial<QuoteFormValues>;
  isSubmitting?: boolean;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [predefinedItems, setPredefinedItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<string>("USD");

  const supabase = createClient();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      status: "draft",
      quote_date: defaultValues?.quote_date ? new Date(defaultValues.quote_date) : new Date(),
      expiry_date: defaultValues?.expiry_date ? new Date(defaultValues.expiry_date) : null,
      items: defaultValues?.items || [],
      tax_rate: defaultValues?.tax_rate ?? null,
      discount_rate: defaultValues?.discount_rate ?? null,
      terms: defaultValues?.terms || "",
      notes: defaultValues?.notes || "",
      customer_id: defaultValues?.customer_id || undefined,
      template_id: defaultValues?.template_id || undefined,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const handleTemplateChange = async (templateId: string) => {
    try {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (!selectedTemplate) return;

      const content = selectedTemplate.content as any;
      
      if (content) {
        if (typeof content.terms === 'string') {
          form.setValue("terms", content.terms);
        }
        if (typeof content.notes === 'string') {
          form.setValue("notes", content.notes);
        }
        if (Array.isArray(content.items)) {
          form.setValue("items", content.items.map((item: any): QuoteFormItemValues => ({
            id: typeof item.id === 'string' ? item.id : undefined,
            item_id: typeof item.item_id === 'string' ? item.item_id : undefined, // Map non-string to undefined
            description: typeof item.description === 'string' ? item.description : "",
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            unit_price: typeof item.unit_price === 'number' ? item.unit_price : 0
          })));
        }
        if (typeof content.tax_rate === 'number') {
          form.setValue("tax_rate", content.tax_rate);
        } else {
          form.setValue("tax_rate", null);
        }
        if (typeof content.discount_rate === 'number') {
          form.setValue("discount_rate", content.discount_rate);
        } else {
          form.setValue("discount_rate", null);
        }
        if (content.expiry_date && typeof content.expiry_date === 'string') {
          form.setValue("expiry_date", new Date(content.expiry_date));
        } else if (content.expiry_date === null) {
          form.setValue("expiry_date", null);
        }
      }
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    }
  };

  const watchItems = form.watch("items");
  const watchTaxRate = form.watch("tax_rate");
  const watchDiscountRate = form.watch("discount_rate");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("User not authenticated. Please sign in.");
          return;
        }

        if (!defaultValues?.quote_number) {
          const generatedNumber = await generateQuoteNumber(supabase);
          form.setValue("quote_number", generatedNumber);
        }

        const { data: settings, error: settingsError } = await supabase
          .from("company_settings")
          .select("default_currency")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
        } else if (settings?.default_currency) {
          setCurrency(settings.default_currency);
        }

        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("id, user_id, company_name, is_active, email, phone, billing_address_line1, billing_address_line2, billing_city, billing_postal_code, billing_country, shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code, shipping_country, created_at, updated_at")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (customersError) throw customersError;
        const mappedCustomers = customersData ? customersData.map(c => ({ ...c, name: c.company_name })) : [];
        setCustomers(mappedCustomers as Customer[]);

        const { data: templatesData, error: templatesError } = await supabase
          .from("quote_templates")
          .select("*")
          .eq("user_id", user.id);

        if (templatesError) throw templatesError;
        setTemplates(templatesData);

        const { data: itemsData, error: itemsError } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", user.id);
        
        if (itemsError) throw itemsError;
        setPredefinedItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const newSubtotal = watchItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    );
    setSubtotal(newSubtotal);

    const taxAmount = (newSubtotal * (watchTaxRate || 0)) / 100;
    const discountAmount = (newSubtotal * (watchDiscountRate || 0)) / 100;
    const newTotal = newSubtotal + taxAmount - discountAmount;
    setTotal(newTotal);
  }, [
    JSON.stringify(watchItems.map(item => ({ q: item.quantity, p: item.unit_price }))),
    watchTaxRate,
    watchDiscountRate
  ]);

  const addItem = () => {
    append({
      id: undefined,
      item_id: undefined,
      description: "",
      quantity: 1,
      unit_price: 0,
    } as QuoteFormItemValues);
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="quote_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote Number</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
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
            name="quote_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
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
                  <PopoverContent 
                    className="w-auto p-0 z-50"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
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
            name="expiry_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
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
                  <PopoverContent 
                    className="w-auto p-0 z-50"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => field.onChange(date ?? null)}
                      disabled={(date) =>
                        date < new Date(form.getValues("quote_date")) || date < new Date("1900-01-01")
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleTemplateChange(value);
                  }}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {fields.map((_, index) => (
                <div key={index} className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`items.${index}.item_id`}
                      render={({ field: itemField }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Link Item</FormLabel>
                          <Select
                            onValueChange={(valueFromDropdown) => {
                              let actualItemIdToStore: string | undefined;
                              if (valueFromDropdown === UNLINKED_ITEM_SELECT_VALUE) {
                                actualItemIdToStore = undefined;
                              } else {
                                actualItemIdToStore = valueFromDropdown;
                              }
                              itemField.onChange(actualItemIdToStore);

                              if (actualItemIdToStore === undefined) {
                                // Clear description and unit price when unlinking or no item is selected
                                form.setValue(`items.${index}.description`, ""); 
                                form.setValue(`items.${index}.unit_price`, 0);  
                              } else {
                                const selectedItem = predefinedItems.find(pItem => pItem.id === actualItemIdToStore);
                                if (selectedItem) {
                                  form.setValue(`items.${index}.description`, selectedItem.name);
                                  form.setValue(`items.${index}.unit_price`, selectedItem.unit_price as number);
                                }
                              }
                            }}
                            value={itemField.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select predefined item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UNLINKED_ITEM_SELECT_VALUE}>-- No Linked Item --</SelectItem>
                              {predefinedItems.map((pItem) => (
                                <SelectItem key={pItem.id} value={pItem.id}>
                                  {pItem.name} (SKU: {pItem.sku || 'N/A'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Item description" {...field} />
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
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
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
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeItem(index)}
                      className="w-full"
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
                className="mt-2"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 5 for 5%"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 10 for 10%"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter quote terms..."
                    className="h-32"
                  />
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
                  <Textarea
                    {...field}
                    placeholder="Enter notes..."
                    className="h-32"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Quote"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 