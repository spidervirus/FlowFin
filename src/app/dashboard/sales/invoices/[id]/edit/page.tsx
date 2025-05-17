"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import DashboardWrapper from "../../../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Database } from '@/types/supabase'

type Invoice = Database['public']['Tables']['invoices']['Row']
type DbCustomer = Database['public']['Tables']['customers']['Row']
type InvoiceItemRow = Database['public']['Tables']['invoice_items']['Row'];

interface CustomerWithMappedName extends DbCustomer { 
  name: string;
}

interface InvoiceItem {
  id?: string;
  item_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceFormData {
  invoice_number: string;
  date: string;
  due_date: string;
  customer_id: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: Invoice['status'];
  notes: string | null;
  delivery_tracking_id: string | null;
  shipping_address: string | null;
}

interface SelectedCustomerDetails {
  name: string;
  email: string;
  address: string;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_number: "",
    date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
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
  });
  const [selectedCustomerDisplay, setSelectedCustomerDisplay] = useState<SelectedCustomerDetails | null>(null);
  const [customers, setCustomers] = useState<CustomerWithMappedName[]>([]);

  console.log("[EDIT PAGE DEBUG - Render] Current 'saving' state:", saving);

  useEffect(() => {
    async function fetchInvoiceAndCustomers() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          setLoading(false);
          return;
        }

        const { data: fetchedCustomers, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (customersError) {
          console.error("[EDIT PAGE DEBUG] Error fetching active customers list:", customersError);
          toast.error("Failed to load customer list: " + customersError.message);
          setCustomers([]);
        } else {
          const mappedCustomers = fetchedCustomers 
            ? fetchedCustomers.map(c => ({ 
                ...c, 
                name: c.company_name || (c as any).name || "Unnamed Customer"
              })) 
            : [];
          setCustomers(mappedCustomers as CustomerWithMappedName[]); 
          console.log("[EDIT PAGE DEBUG] Fetched and mapped customers for dropdown:", mappedCustomers);
        }

        console.log(`[EDIT PAGE DEBUG] Fetching invoice with ID: ${invoiceId} for user: ${user.id}`);
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .eq("user_id", user.id)
          .single();

        if (invoiceError) {
          console.error("[EDIT PAGE DEBUG] Error fetching main invoice:", invoiceError);
          toast.error("Error fetching invoice details: " + invoiceError.message);
          setLoading(false);
          return;
        }

        if (invoiceData) {
          console.log("[EDIT PAGE DEBUG] Fetched main invoice data:", invoiceData);

          const { data: itemsData, error: itemsError } = await supabase
            .from("invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId)
            .order("created_at");

          const typedItemsData = itemsData as InvoiceItemRow[] | null;

          if (itemsError) {
            console.error("[EDIT PAGE DEBUG] Error fetching invoice items:", itemsError);
            toast.error("Error fetching invoice items: " + itemsError.message);
            const currentItems: InvoiceItem[] = [];
            setFormData({
              ...invoiceData,
              date: invoiceData.date ? format(new Date(invoiceData.date), "yyyy-MM-dd") : "",
              due_date: invoiceData.due_date ? format(new Date(invoiceData.due_date), "yyyy-MM-dd") : "",
              customer_id: invoiceData.customer_id || "",
              items: currentItems.length > 0 ? currentItems : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
              subtotal: invoiceData.subtotal || 0,
              tax_rate: invoiceData.tax_rate || 0,
              tax_amount: invoiceData.tax_amount || 0,
              total_amount: invoiceData.total_amount || 0,
              status: (invoiceData.status as Invoice['status']) || "draft",
              notes: invoiceData.notes || "",
              delivery_tracking_id: invoiceData.delivery_tracking_id || null,
              shipping_address: invoiceData.shipping_address || null,
            });
            setSelectedCustomerDisplay(null);
            setLoading(false);
            return;
          }
          console.log("[EDIT PAGE DEBUG] Fetched invoice items data:", typedItemsData);

          const transformedItems = typedItemsData 
            ? typedItemsData.map(item => ({
                id: item.id,
                item_id: (item as any).item_id as string | null,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.amount,
              })) 
            : [];
          console.log("[EDIT PAGE DEBUG] Transformed items for form:", transformedItems);

          if (invoiceData.customer_id && customers.length > 0) {
            const currentCustomer = customers.find(c => c.id === invoiceData.customer_id);
            if (currentCustomer) {
              setSelectedCustomerDisplay({
                name: currentCustomer.name,
                email: currentCustomer.email || "N/A",
                address: currentCustomer.billing_address_line1 || "N/A",
              });
            } else { setSelectedCustomerDisplay(null); }
          } else {
            setSelectedCustomerDisplay(null);
          }

          setFormData({
            ...invoiceData,
            date: invoiceData.date ? format(new Date(invoiceData.date), "yyyy-MM-dd") : "",
            due_date: invoiceData.due_date ? format(new Date(invoiceData.due_date), "yyyy-MM-dd") : "",
            customer_id: invoiceData.customer_id || "",
            items: transformedItems.length > 0 ? transformedItems : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
            subtotal: invoiceData.subtotal || 0,
            tax_rate: invoiceData.tax_rate || 0,
            tax_amount: invoiceData.tax_amount || 0,
            total_amount: invoiceData.total_amount || 0,
            status: (invoiceData.status as Invoice['status']) || "draft",
            notes: invoiceData.notes || "",
            delivery_tracking_id: invoiceData.delivery_tracking_id || null,
            shipping_address: invoiceData.shipping_address || null,
          });
        } else {
          console.log("[EDIT PAGE DEBUG] No invoice data found for this ID.");
          toast.error("Invoice not found.");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading invoice");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoiceAndCustomers();
  }, [invoiceId, router]);

  const calculateItemAmount = (item: InvoiceItem) => {
    return item.quantity * item.unit_price;
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...formData.items];
    const currentItem = { ...newItems[index] };

    if (field === 'quantity' || field === 'unit_price') {
      currentItem[field] = Number(value);
    } else if (field === 'description') {
      currentItem[field] = String(value);
    }
    currentItem.amount = calculateItemAmount(currentItem);
    newItems[index] = currentItem;

    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = formData.tax_rate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    console.log(`[EDIT PAGE DEBUG - updateItem] Item at index ${index} changed. Field: ${field}, New Value: ${value}. Updated currentItem:`, currentItem);
    console.log("[EDIT PAGE DEBUG - updateItem] New items array for formData:", newItems);

    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, unit_price: 0, amount: 0 },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + formData.tax_amount;

    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      total_amount: total,
    });
  };

  const handleInputChange = (
    field: keyof Omit<InvoiceFormData, 'items'>,
    value: string | number | null | Invoice['status']
  ) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };

      if (field === 'tax_rate') {
        const subtotal = newFormData.subtotal || 0;
        const taxRate = Number(value) || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        
        return {
          ...newFormData,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total,
        };
      }
      return newFormData;
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    if (!customers) return;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({ ...prev, customer_id: customer.id }));
      setSelectedCustomerDisplay({
        name: customer.name,
        email: customer.email || "N/A",
        address: customer.billing_address_line1 || "N/A",
      });
    } else {
      setFormData(prev => ({ ...prev, customer_id: "" }));
      setSelectedCustomerDisplay(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[EDIT PAGE DEBUG - handleSubmit ENTRY] Current 'saving' state:", saving);
    setSaving(true);
    console.log("[EDIT PAGE DEBUG] handleSubmit triggered. Current formData:", formData);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to update an invoice.");
        router.push("/sign-in");
        setSaving(false);
        return;
      }

      const invoiceUpdateData: Partial<Omit<Invoice, 'items'>> & { updated_at: string } = {
        invoice_number: formData.invoice_number,
        date: formData.date,
        due_date: formData.due_date,
        customer_id: formData.customer_id,
        subtotal: formData.subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        status: formData.status,
        notes: formData.notes || null,
        delivery_tracking_id: formData.delivery_tracking_id || null,
        shipping_address: formData.shipping_address || null,
        updated_at: new Date().toISOString(),
        user_id: user.id,
      };
      
      console.log("[EDIT PAGE DEBUG] Data for invoice update:", invoiceUpdateData);

      const { error: updateError } = await supabase
        .from("invoices")
        .update(invoiceUpdateData)
        .eq("id", invoiceId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[EDIT PAGE DEBUG] Error updating main invoice:", updateError);
        throw updateError;
      }
      console.log("[EDIT PAGE DEBUG] Main invoice updated successfully.");

      console.log("[EDIT PAGE DEBUG] Deleting existing invoice items for invoice ID:", invoiceId);
      const { error: deleteItemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      if (deleteItemsError) {
        console.error("[EDIT PAGE DEBUG] Error deleting existing invoice items:", deleteItemsError);
        throw deleteItemsError;
      }
      console.log("[EDIT PAGE DEBUG] Existing invoice items deleted.");

      if (formData.items && formData.items.length > 0) {
        const itemsToInsert = formData.items.map(item => ({
          invoice_id: invoiceId,
          item_id: item.item_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          user_id: user.id,
        }));
        console.log("[EDIT PAGE DEBUG] Inserting new invoice items:", itemsToInsert);
        const { error: insertItemsError } = await supabase
          .from("invoice_items")
          .insert(itemsToInsert);

        if (insertItemsError) {
          console.error("[EDIT PAGE DEBUG] Error inserting new invoice items:", insertItemsError);
          throw insertItemsError;
        }
        console.log("[EDIT PAGE DEBUG] New invoice items inserted successfully.");
      }

      toast.success("Invoice updated successfully");
      router.push(`/dashboard/sales/invoices/${invoiceId}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error updating invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading invoice...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href={`/dashboard/sales/invoices/${invoiceId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-2">
              Edit Invoice #{formData.invoice_number}
            </h1>
          </div>
          <div className="flex justify-end space-x-4">
            <Link href={`/dashboard/sales/invoices/${invoiceId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" form="edit-invoice-form" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <form id="edit-invoice-form" onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Edit the details for invoice #{formData.invoice_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange("invoice_number", e.target.value)}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers && customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} 
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                    required
                  />
                </div>
              </div>

              {selectedCustomerDisplay && (
                <div className="mt-4 p-4 border rounded-md bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Customer Details:</h4>
                  <p className="text-sm"><strong>Name:</strong> {selectedCustomerDisplay.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedCustomerDisplay.email}</p>
                  <p className="text-sm"><strong>Address:</strong> {selectedCustomerDisplay.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>
                Add or edit items in this invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 items-start"
                  >
                    <div className="col-span-4">
                      <Label htmlFor={`item-${index}-description`}>
                        Description
                      </Label>
                      <Input
                        id={`item-${index}-description`}
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
                      <Input
                        id={`item-${index}-quantity`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`item-${index}-price`}>Unit Price</Label>
                      <Input
                        id={`item-${index}-price`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, "unit_price", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Amount</Label>
                      <Input
                        value={item.amount.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="col-span-1 pt-8">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Subtotal</Label>
                    <Input
                      value={formData.subtotal.toFixed(2)}
                      readOnly
                      className="w-[200px] bg-gray-50"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) =>
                        handleInputChange("tax_rate", Number(e.target.value))
                      }
                      className="w-[200px]"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Tax Amount</Label>
                    <Input
                      value={formData.tax_amount.toFixed(2)}
                      readOnly
                      className="w-[200px] bg-gray-50"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Label className="text-lg font-semibold">
                      Total Amount
                    </Label>
                    <Input
                      value={formData.total_amount.toFixed(2)}
                      readOnly
                      className="w-[200px] bg-gray-50 text-lg font-semibold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Add any additional notes or payment terms
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes ?? ""}
                  onChange={(e) => handleInputChange("notes", e.target.value || null)}
                  placeholder="Add any additional notes or terms"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardWrapper>
  );
}