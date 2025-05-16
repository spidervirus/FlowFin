import { z } from "zod";

// Shipping Zone Schema
export const shippingZoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).optional(),
  postal_codes: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
});

export type ShippingZone = z.infer<typeof shippingZoneSchema>;

// Delivery Charge Rate Schema
export const deliveryChargeRateSchema = z.object({
  id: z.string().optional(),
  shipping_zone_id: z.string().min(1, "Shipping zone is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  base_rate: z.number().min(0, "Base rate must be 0 or greater"),
  per_kg_rate: z.number().min(0, "Per kg rate must be 0 or greater").optional(),
  min_weight: z.number().min(0, "Minimum weight must be 0 or greater").optional(),
  max_weight: z.number().min(0, "Maximum weight must be 0 or greater").optional(),
  min_order_amount: z.number().min(0, "Minimum order amount must be 0 or greater").optional(),
  max_order_amount: z.number().min(0, "Maximum order amount must be 0 or greater").optional(),
  free_shipping_threshold: z.number().min(0, "Free shipping threshold must be 0 or greater").optional(),
  is_active: z.boolean().default(true),
});

export type DeliveryChargeRate = z.infer<typeof deliveryChargeRateSchema>;

// Delivery Tracking Schema
export const deliveryTrackingSchema = z.object({
  id: z.string().optional(),
  invoice_id: z.string().min(1, "Invoice is required"),
  tracking_number: z.string().min(1, "Tracking number is required"),
  carrier: z.string().min(1, "Carrier is required"),
  status: z.enum(["pending", "in_transit", "delivered", "failed", "cancelled"]),
  estimated_delivery_date: z.date().optional(),
  actual_delivery_date: z.date().optional(),
  shipping_address: z.string().min(1, "Shipping address is required"),
  weight: z.number().min(0, "Weight must be 0 or greater").optional(),
  notes: z.string().optional(),
  tracking_url: z.string().url().optional(),
});

export type DeliveryTracking = z.infer<typeof deliveryTrackingSchema>;

// Form Schemas
export const shippingZoneFormSchema = shippingZoneSchema.omit({ id: true });
export const deliveryChargeRateFormSchema = deliveryChargeRateSchema.omit({ id: true });
export const deliveryTrackingFormSchema = deliveryTrackingSchema.omit({ id: true });

export type ShippingZoneFormValues = z.infer<typeof shippingZoneFormSchema>;
export type DeliveryChargeRateFormValues = z.infer<typeof deliveryChargeRateFormSchema>;
export type DeliveryTrackingFormValues = z.infer<typeof deliveryTrackingFormSchema>;