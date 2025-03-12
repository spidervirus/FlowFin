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
import { ArrowLeft, CalendarIcon, Plus, Save, Trash } from "lucide-react";
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>
                    Select an existing client or enter new client details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client">Client</Label>
                      <Select>
                        <SelectTrigger id="client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">+ Add New Client</SelectItem>
                          <SelectItem value="abc-corp">
                            ABC Corporation
                          </SelectItem>
                          <SelectItem value="xyz-ltd">XYZ Ltd</SelectItem>
                          <SelectItem value="acme-inc">Acme Inc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-name">Client Name</Label>
                        <Input id="client-name" placeholder="Client name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-email">Client Email</Label>
                        <Input
                          id="client-email"
                          type="email"
                          placeholder="client@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-address">Client Address</Label>
                      <Textarea
                        id="client-address"
                        placeholder="Client address"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Items</CardTitle>
                  <CardDescription>Add items to your invoice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                              Description
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground w-24">
                              Quantity
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground w-32">
                              Price
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground w-32">
                              Total
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2].map((item) => (
                            <tr key={item} className="border-b">
                              <td className="py-3 px-2">
                                <Input placeholder="Item description" />
                              </td>
                              <td className="py-3 px-2">
                                <Input type="number" min="1" defaultValue="1" />
                              </td>
                              <td className="py-3 px-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <div className="text-right font-medium">
                                  $0.00
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Trash className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>

                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal:
                          </span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Tax (0%):
                          </span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold">$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Add any additional notes to your invoice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any additional notes or payment instructions"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Invoice Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Settings</CardTitle>
                  <CardDescription>
                    Configure your invoice details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoice-number">Invoice Number</Label>
                      <Input id="invoice-number" defaultValue="INV-001" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issue-date">Issue Date</Label>
                      <Input
                        id="issue-date"
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input
                        id="due-date"
                        type="date"
                        defaultValue={
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0]
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select defaultValue="draft">
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button>
                  <Save className="mr-2 h-4 w-4" /> Save Invoice
                </Button>
                <Button variant="outline">Preview Invoice</Button>
                <Link href="/dashboard/invoices" className="w-full">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
