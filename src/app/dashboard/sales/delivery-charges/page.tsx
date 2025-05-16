"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AddShippingZoneDialog } from "@/components/dialogs/AddShippingZoneDialog";
import { AddDeliveryRateDialog } from "@/components/dialogs/AddDeliveryRateDialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ShippingZoneFormValues, DeliveryChargeRateFormValues } from "@/types/delivery";
import { ColumnDef } from "@tanstack/react-table";

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions?: string[];
  is_active: boolean;
  created_at: string;
}

interface DeliveryRate {
  id: string;
  name: string;
  base_rate: number;
  per_kg_rate?: number;
  is_active: boolean;
  shipping_zone?: {
    name: string;
  };
  created_at: string;
}

export default function DeliveryChargesPage() {
  const [activeTab, setActiveTab] = useState("zones");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchShippingZones();
    fetchDeliveryRates();
  }, []);

  const fetchShippingZones = async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setShippingZones(data || []);
    } catch (error) {
      console.error("Error fetching shipping zones:", error);
      toast.error("Failed to fetch shipping zones");
    }
  };

  const fetchDeliveryRates = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_charge_rates")
        .select(`
          *,
          shipping_zone:shipping_zones(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDeliveryRates(data || []);
    } catch (error) {
      console.error("Error fetching delivery rates:", error);
      toast.error("Failed to fetch delivery rates");
    }
  };

  const handleCreateShippingZone = async (data: ShippingZoneFormValues) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("shipping_zones").insert(data);
      if (error) throw error;
      toast.success("Shipping zone created successfully");
      setIsZoneDialogOpen(false);
      fetchShippingZones();
    } catch (error) {
      console.error("Error creating shipping zone:", error);
      toast.error("Failed to create shipping zone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDeliveryRate = async (data: DeliveryChargeRateFormValues) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("delivery_charge_rates").insert(data);
      if (error) throw error;
      toast.success("Delivery rate created successfully");
      setIsRateDialogOpen(false);
      fetchDeliveryRates();
    } catch (error) {
      console.error("Error creating delivery rate:", error);
      toast.error("Failed to create delivery rate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const zoneColumns: ColumnDef<ShippingZone>[] = [
    {
      accessorKey: "name",
      header: "Zone Name",
    },
    {
      accessorKey: "countries",
      header: "Countries",
      cell: ({ row }) => {
        const countries = row.original.countries;
        return countries.join(", ");
      },
    },
    {
      accessorKey: "regions",
      header: "Regions",
      cell: ({ row }) => {
        const regions = row.original.regions;
        return regions?.join(", ") || "-";
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.original.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const rateColumns: ColumnDef<DeliveryRate>[] = [
    {
      accessorKey: "name",
      header: "Rate Name",
    },
    {
      accessorKey: "base_rate",
      header: "Base Rate",
      cell: ({ row }) => {
        return `$${row.original.base_rate.toFixed(2)}`;
      },
    },
    {
      accessorKey: "per_kg_rate",
      header: "Per KG Rate",
      cell: ({ row }) => {
        return row.original.per_kg_rate
          ? `$${row.original.per_kg_rate.toFixed(2)}`
          : "-";
      },
    },
    {
      accessorKey: "shipping_zone",
      header: "Shipping Zone",
      cell: ({ row }) => row.original.shipping_zone?.name || "-",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.original.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Delivery Charges"
        text="Manage your shipping zones and delivery charge rates."
      >
        <Button
          onClick={() => {
            if (activeTab === "zones") {
              setIsZoneDialogOpen(true);
            } else {
              setIsRateDialogOpen(true);
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "zones" ? "Add Zone" : "Add Rate"}
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="zones" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="rates">Delivery Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <div className="grid gap-4">
            <DataTable columns={zoneColumns} data={shippingZones} />
          </div>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <div className="grid gap-4">
            <DataTable columns={rateColumns} data={deliveryRates} />
          </div>
        </TabsContent>
      </Tabs>

      <AddShippingZoneDialog
        open={isZoneDialogOpen}
        onOpenChange={setIsZoneDialogOpen}
        onSubmit={handleCreateShippingZone}
        isSubmitting={isSubmitting}
      />

      <AddDeliveryRateDialog
        open={isRateDialogOpen}
        onOpenChange={setIsRateDialogOpen}
        onSubmit={handleCreateDeliveryRate}
        isSubmitting={isSubmitting}
        shippingZones={shippingZones.map(zone => ({
          id: zone.id,
          name: zone.name,
        }))}
      />
    </DashboardShell>
  );
} 