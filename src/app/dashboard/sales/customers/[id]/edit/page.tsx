"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Customer } from "@/types/sales"; // Import main Customer type
import CustomerFormComponent from "@/components/customer-components/customer-form"; // Renamed to avoid conflict

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<Partial<Customer> | undefined>(undefined);

  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Authentication required.");
          router.push("/sign-in");
          return;
        }

        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          toast.error(error?.message || "Failed to fetch customer details.");
          router.push("/dashboard/sales/customers");
          return;
        }
        // Explicitly map fetched data to the Customer type
        // Assuming 'company_name' from the fetched data should be mapped to 'name'
        // and other fields match or are handled (e.g. nullable fields)
        const customer: Partial<Customer> = {
          id: data.id,
          user_id: data.user_id,
          name: data.company_name || "Unnamed Customer", // Rely on company_name or fallback
          email: data.email,
          phone: data.phone,
          billing_address_line1: data.billing_address_line1,
          billing_address_line2: data.billing_address_line2,
          billing_city: data.billing_city,
          billing_state_province: data.billing_state_province,
          billing_postal_code: data.billing_postal_code,
          billing_country: data.billing_country,
          shipping_address_line1: data.shipping_address_line1,
          shipping_address_line2: data.shipping_address_line2,
          shipping_city: data.shipping_city,
          shipping_state_province: data.shipping_state_province,
          shipping_postal_code: data.shipping_postal_code,
          shipping_country: data.shipping_country,
          tax_id: data.tax_id,
          notes: data.notes,
          is_active: data.is_active === undefined ? true : data.is_active, // Default to true if undefined
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setCustomerData(customer);
      } catch (err) {
        console.error("Error fetching customer:", err);
        toast.error("An unexpected error occurred while fetching customer details.");
        router.push("/dashboard/sales/customers");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchCustomer();
    }
  }, [params.id, router]);

  const handleSuccess = () => {
    toast.success("Customer updated successfully!");
    router.push(`/dashboard/sales/customers`); // Navigate to list or detail page
    // Optionally, could navigate to `/dashboard/sales/customers/${params.id}` if a detail page exists
  };

  if (loading && !customerData) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!customerData && !loading) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col justify-center items-center h-[60vh]">
          <p className="text-lg font-semibold mb-2">Customer not found.</p>
          <p className="text-muted-foreground mb-4">Could not load customer details or customer does not exist.</p>
          <Link href="/dashboard/sales/customers">
            <Button variant="outline">Back to Customers</Button>
          </Link>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
           <Link href="/dashboard/sales/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Customer</h1>
            <p className="text-muted-foreground">
              Update the details for {customerData?.name || "this customer"}.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Modify the customer's details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerData && (
              <CustomerFormComponent
                initialData={customerData}
                customerId={params.id}
                onSuccess={handleSuccess}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
} 