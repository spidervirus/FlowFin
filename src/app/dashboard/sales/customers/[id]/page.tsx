"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DashboardWrapper from "../../../dashboard-wrapper";
import { format } from "date-fns";
import { Customer } from "@/types/sales";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const supabase = createClient();

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to view customer details");
        router.push("/sign-in");
        return;
      }

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*, user_id(*)")
        .eq("id", params.id as string)
        .eq("user_id", user.id)
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        toast.error(customerError.message || "Failed to fetch customer.");
        router.push("/dashboard/sales/customers");
        return;
      }
      if (!customerData) {
        toast.error("Customer not found.");
        router.push("/dashboard/sales/customers");
        return;
      }
      setCustomer(customerData as Customer);

      // Fetch customer transactions - COMMENTED OUT FOR NOW
      /*
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", params.id)
        .order("date", { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
      */
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
      toast.error(error.message || "Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCustomerData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!customer) {
    return (
      <DashboardWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Customer not found</h1>
            <Link href="/dashboard/sales/customers">
              <Button>Return to Customers</Button>
            </Link>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <DashboardWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/sales/customers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              <p className="text-muted-foreground">Customer Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={customer.is_active ? "default" : "secondary"}>
              {customer.is_active ? "Active" : "Inactive"}
            </Badge>
            <Link href={`/dashboard/sales/customers/${customer.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Contact &amp; Billing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {(customer.billing_address_line1 || customer.billing_city || customer.billing_country) && (
                    <div className="flex items-start gap-2 pt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">Billing Address:</p>
                        {customer.billing_address_line1 && <p>{customer.billing_address_line1}</p>}
                        {customer.billing_address_line2 && <p>{customer.billing_address_line2}</p>}
                        <p>
                          {customer.billing_city && <span>{customer.billing_city}, </span>}
                          {customer.billing_state_province && <span>{customer.billing_state_province} </span>}
                          {customer.billing_postal_code && <span>{customer.billing_postal_code}</span>}
                        </p>
                        {customer.billing_country && <p>{customer.billing_country}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping &amp; Tax</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(customer.shipping_address_line1 || customer.shipping_city || customer.shipping_country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">Shipping Address:</p>
                        {customer.shipping_address_line1 && <p>{customer.shipping_address_line1}</p>}
                        {customer.shipping_address_line2 && <p>{customer.shipping_address_line2}</p>}
                        <p>
                          {customer.shipping_city && <span>{customer.shipping_city}, </span>}
                          {customer.shipping_state_province && <span>{customer.shipping_state_province} </span>}
                          {customer.shipping_postal_code && <span>{customer.shipping_postal_code}</span>}
                        </p>
                        {customer.shipping_country && <p>{customer.shipping_country}</p>}
                      </div>
                    </div>
                  )}
                   {customer.tax_id && (
                    <div className="flex items-center gap-2 pt-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Tax ID: {customer.tax_id}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {customer.notes && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
} 