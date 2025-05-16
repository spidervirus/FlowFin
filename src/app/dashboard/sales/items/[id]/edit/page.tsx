"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardWrapper from "../../../../dashboard-wrapper";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ItemForm, type ItemFormValues } from "@/components/forms/ItemForm";
import { Item } from "@/types/sales";

interface EditItemPageProps {
  params: {
    id: string;
  };
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("Item not found");
          router.push("/dashboard/sales/items");
          return;
        }

        setItem(data);
      } catch (error) {
        console.error("Error fetching item:", error);
        toast.error("Failed to load item");
        router.push("/dashboard/sales/items");
      }
    };

    fetchItem();
  }, [params.id]);

  const handleSubmit = async (data: ItemFormValues) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("items")
        .update(data)
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Item updated successfully");
      router.push("/dashboard/sales/items");
      router.refresh();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) {
    return null;
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <DashboardHeader
          heading="Edit Item"
          text="Update your product or service item details."
        />

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemForm
              initialData={item}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
} 