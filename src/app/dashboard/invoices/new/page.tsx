import DashboardNavbar from "@/components/dashboard-navbar";
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
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";

export default async function NewInvoicePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch accounts for the dropdown
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name");

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
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
              <form action="/api/invoices" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      name="invoice_number"
                      placeholder="e.g., INV-001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      defaultValue={
                        new Date(new Date().setDate(new Date().getDate() + 30))
                          .toISOString()
                          .split("T")[0]
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_id">Deposit Account</Label>
                    <Select name="account_id" required>
                      <SelectTrigger id="account_id">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      name="client_name"
                      placeholder="e.g., Acme Corporation"
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
                      required
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm">
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
                            Unit Price
                          </th>
                          <th className="text-left p-3 font-medium text-muted-foreground w-32">
                            Amount
                          </th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3">
                            <Input
                              name="items[0][description]"
                              placeholder="Item description"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              name="items[0][quantity]"
                              type="number"
                              min="1"
                              defaultValue="1"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              name="items[0][unit_price]"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              name="items[0][amount]"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              disabled
                              className="bg-muted"
                            />
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" type="button">
                              <Trash className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (0%):</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>$0.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Payment terms, thank you message, or any additional information"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Link href="/dashboard/invoices">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Save Invoice
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
