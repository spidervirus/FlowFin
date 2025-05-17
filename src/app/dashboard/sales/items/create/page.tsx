"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardWrapper from "../../../dashboard-wrapper";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ItemForm, type ItemFormValues } from "@/components/forms/ItemForm";

export default function CreateItemPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (data: ItemFormValues) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      if (!data.name) {
        toast.error("Item name is required.");
        setIsLoading(false);
        return;
      }

      const itemToInsert = {
        user_id: user.id,
        name: data.name,
        description: data.description,
        unit_price: data.unit_price,
        sku: data.sku,
      };

      const { error } = await supabase
        .from("items")
        .insert([itemToInsert]);

      if (error) throw error;

      toast.success("Item created successfully");
      router.push("/dashboard/sales/items");
      router.refresh();
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <DashboardHeader
          heading="Create Item"
          text="Add a new product or service item."
        />

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemForm onSubmit={handleSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
} 