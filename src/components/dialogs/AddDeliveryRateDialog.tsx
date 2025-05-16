"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeliveryChargeRateForm } from "@/components/forms/DeliveryChargeRateForm";
import { DeliveryChargeRateFormValues } from "@/types/delivery";

interface AddDeliveryRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DeliveryChargeRateFormValues) => void;
  isSubmitting?: boolean;
  shippingZones: { id: string; name: string }[];
}

export function AddDeliveryRateDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  shippingZones,
}: AddDeliveryRateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle>Add Delivery Rate</DialogTitle>
          <DialogDescription>
            Create a new delivery rate for a shipping zone.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          <DeliveryChargeRateForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            shippingZones={shippingZones}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 