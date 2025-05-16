"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShippingZoneForm } from "@/components/forms/ShippingZoneForm";
import { ShippingZoneFormValues } from "@/types/delivery";

interface AddShippingZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ShippingZoneFormValues) => void;
  isSubmitting?: boolean;
}

export function AddShippingZoneDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AddShippingZoneDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle>Add Shipping Zone</DialogTitle>
          <DialogDescription>
            Create a new shipping zone to define delivery areas.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          <ShippingZoneForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}