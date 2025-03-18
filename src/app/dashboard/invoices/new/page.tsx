"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Save, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import DashboardWrapper from "../../dashboard-wrapper";

export default function NewInvoicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('USD');
  const [formData, setFormData] = useState({
    invoice_number: '',
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    account_id: '',
    client_name: '',
    client_email: '',
    client_address: '',
    notes: ''
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Check if user is authenticated
        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/sign-in');
          return;
        }
        
        setUser(user);
        
        // Get company settings
        const { data: settingsData } = await supabaseClient
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // Set currency from settings or default to USD
        const currency = settingsData?.default_currency as CurrencyCode || 'USD';
        setDefaultCurrency(currency);
        
        // Fetch accounts for the dropdown
        const { data: accountsData } = await supabaseClient
          .from("accounts")
          .select("id, name")
          .order("name");
        
        setAccounts(accountsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const newItems = [...lineItems];
      newItems.splice(index, 1);
      setLineItems(newItems);
      calculateTotals(newItems);
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setLineItems(newItems);
    calculateTotals(newItems);
  };

  const calculateTotals = (items: any[]) => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const newTax = 0; // You could calculate tax here if needed
    const newTotal = newSubtotal + newTax;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const supabaseClient = createClient();
      
      // Prepare data for submission
      const invoiceData = {
        invoice_number: formData.invoice_number,
        date: formData.date,
        due_date: formData.due_date,
        account_id: formData.account_id,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_address: formData.client_address,
        notes: formData.notes,
        items: JSON.stringify(lineItems),
        subtotal,
        tax_rate: 0,
        tax_amount: tax,
        discount_amount: 0,
        total_amount: total,
        status: 'draft',
        user_id: user.id,
        payment_terms: 'Due on receipt'
      };
      
      // Insert invoice into database
      const { data, error } = await supabaseClient
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating invoice:', error);
        alert('Failed to create invoice. Please try again.');
        return;
      }
      
      // Redirect to invoice list on success
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardWrapper>
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-lg">Loading...</p>
          </div>
        </DashboardWrapper>
      </>
    );
  }

  return (
    <>
      <DashboardWrapper>
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/invoices">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">New Invoice</h1>
                <p className="text-muted-foreground">
                  Create a new invoice for your client
                </p>
              </div>
            </div>
          </header>

          {/* Invoice Form */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Enter the details of your invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      name="invoice_number"
                      placeholder="e.g., INV-001"
                      value={formData.invoice_number}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_id">Deposit Account</Label>
                    <select 
                      id="account_id"
                      name="account_id"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.account_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      name="client_name"
                      placeholder="e.g., Acme Corporation"
                      value={formData.client_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_email">Client Email</Label>
                    <Input
                      id="client_email"
                      name="client_email"
                      type="email"
                      placeholder="e.g., client@example.com"
                      value={formData.client_email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_address">Client Address</Label>
                    <Textarea
                      id="client_address"
                      name="client_address"
                      placeholder="Client's full address"
                      rows={3}
                      value={formData.client_address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>

                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-muted-foreground">
                            Description
                          </th>
                          <th className="text-left p-3 font-medium text-muted-foreground w-24">
                            Quantity
                          </th>
                          <th className="text-left p-3 font-medium text-muted-foreground w-32">
                            Unit Price ({CURRENCY_CONFIG[defaultCurrency]?.symbol || '$'})
                          </th>
                          <th className="text-left p-3 font-medium text-muted-foreground w-32">
                            Amount ({CURRENCY_CONFIG[defaultCurrency]?.symbol || '$'})
                          </th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">
                              <Input
                                name={`items[${index}][description]`}
                                value={item.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                placeholder="Item description"
                                required
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                name={`items[${index}][quantity]`}
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                                required
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                name={`items[${index}][unit_price]`}
                                step="0.01"
                                placeholder="0.00"
                                value={item.unit_price}
                                onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value))}
                                required
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                name={`items[${index}][amount]`}
                                step="0.01"
                                placeholder="0.00"
                                value={item.amount}
                                disabled
                                className="bg-muted"
                              />
                            </td>
                            <td className="p-3">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                type="button"
                                onClick={() => removeLineItem(index)}
                                disabled={lineItems.length === 1}
                              >
                                <Trash className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>
                          {new Intl.NumberFormat(CURRENCY_CONFIG[defaultCurrency]?.locale || 'en-US', {
                            style: 'currency',
                            currency: defaultCurrency,
                            minimumFractionDigits: CURRENCY_CONFIG[defaultCurrency]?.minimumFractionDigits ?? 2
                          }).format(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (0%):</span>
                        <span>
                          {new Intl.NumberFormat(CURRENCY_CONFIG[defaultCurrency]?.locale || 'en-US', {
                            style: 'currency',
                            currency: defaultCurrency,
                            minimumFractionDigits: CURRENCY_CONFIG[defaultCurrency]?.minimumFractionDigits ?? 2
                          }).format(tax)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>
                          {new Intl.NumberFormat(CURRENCY_CONFIG[defaultCurrency]?.locale || 'en-US', {
                            style: 'currency',
                            currency: defaultCurrency,
                            minimumFractionDigits: CURRENCY_CONFIG[defaultCurrency]?.minimumFractionDigits ?? 2
                          }).format(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Payment terms, thank you message, or any additional information"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Link href="/dashboard/invoices">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Save Invoice
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardWrapper>
    </>
  );
}

