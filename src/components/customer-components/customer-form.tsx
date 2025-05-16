"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Customer } from "@/types/sales";
import { Switch } from "@/components/ui/switch";

const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  
  billing_address_line1: z.string().optional().or(z.literal('')),
  billing_address_line2: z.string().optional().or(z.literal('')),
  billing_city: z.string().optional().or(z.literal('')),
  billing_state_province: z.string().optional().or(z.literal('')),
  billing_postal_code: z.string().optional().or(z.literal('')),
  billing_country: z.string().optional().or(z.literal('')),

  shipping_address_line1: z.string().optional().or(z.literal('')),
  shipping_address_line2: z.string().optional().or(z.literal('')),
  shipping_city: z.string().optional().or(z.literal('')),
  shipping_state_province: z.string().optional().or(z.literal('')),
  shipping_postal_code: z.string().optional().or(z.literal('')),
  shipping_country: z.string().optional().or(z.literal('')),
  
  tax_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  initialData?: Partial<Customer>;
  customerId?: string;
  onSuccess?: () => void;
}

export default function CustomerForm({
  initialData,
  customerId,
  onSuccess,
}: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!customerId;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      billing_address_line1: initialData?.billing_address_line1 || "",
      billing_address_line2: initialData?.billing_address_line2 || "",
      billing_city: initialData?.billing_city || "",
      billing_state_province: initialData?.billing_state_province || "",
      billing_postal_code: initialData?.billing_postal_code || "",
      billing_country: initialData?.billing_country || "",
      shipping_address_line1: initialData?.shipping_address_line1 || "",
      shipping_address_line2: initialData?.shipping_address_line2 || "",
      shipping_city: initialData?.shipping_city || "",
      shipping_state_province: initialData?.shipping_state_province || "",
      shipping_postal_code: initialData?.shipping_postal_code || "",
      shipping_country: initialData?.shipping_country || "",
      tax_id: initialData?.tax_id || "",
      notes: initialData?.notes || "",
      is_active: initialData?.is_active === undefined ? true : initialData.is_active,
    },
  });

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to continue");
        setLoading(false);
        return;
      }

      const submissionData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id?: string } = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        billing_address_line1: formData.billing_address_line1 || null,
        billing_address_line2: formData.billing_address_line2 || null,
        billing_city: formData.billing_city || null,
        billing_state_province: formData.billing_state_province || null,
        billing_postal_code: formData.billing_postal_code || null,
        billing_country: formData.billing_country || null,
        shipping_address_line1: formData.shipping_address_line1 || null,
        shipping_address_line2: formData.shipping_address_line2 || null,
        shipping_city: formData.shipping_city || null,
        shipping_state_province: formData.shipping_state_province || null,
        shipping_postal_code: formData.shipping_postal_code || null,
        shipping_country: formData.shipping_country || null,
        tax_id: formData.tax_id || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      if (isEditing && customerId) {
        const { error } = await supabase
          .from("customers")
          .update(submissionData)
          .eq("id", customerId)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        const { error } = await supabase.from("customers").insert({
          ...submissionData,
          user_id: user.id,
        });

        if (error) throw error;
        toast.success("Customer created successfully");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/sales/customers");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(isEditing ? "Error updating customer" : "Error creating customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer or company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tax ID (e.g., VAT, EIN)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Billing Address */}
        <h3 className="text-lg font-medium mt-4">Billing Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="billing_address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl>
                  <Input placeholder="Street address, P.O. box" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_address_line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Apartment, suite, unit, building" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_state_province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <FormControl>
                  <Input placeholder="Enter state or province" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Enter country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Shipping Address */}
        <h3 className="text-lg font-medium mt-4">Shipping Address</h3>
        {/* TODO: Add a checkbox "Same as Billing Address" to auto-fill */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="shipping_address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl>
                  <Input placeholder="Street address, P.O. box" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping_address_line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Apartment, suite, unit, building" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping_state_province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <FormControl>
                  <Input placeholder="Enter state or province" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping_postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Enter country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Other Information */}
        <h3 className="text-lg font-medium mt-4">Other Information</h3>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes (optional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive customers will not appear in selection lists.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/sales/customers")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Customer")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 