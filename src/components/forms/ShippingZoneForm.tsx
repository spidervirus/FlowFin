"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { countries } from "@/lib/constants/countries";
import { ShippingZoneFormValues, shippingZoneFormSchema } from "@/types/delivery";

interface ShippingZoneFormProps {
  defaultValues?: Partial<ShippingZoneFormValues>;
  onSubmit: (data: ShippingZoneFormValues) => void;
  isSubmitting?: boolean;
}

export function ShippingZoneForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ShippingZoneFormProps) {
  const form = useForm<ShippingZoneFormValues>({
    resolver: zodResolver(shippingZoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      countries: [],
      regions: [],
      postal_codes: [],
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter zone name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter zone description"
                    className="h-20 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="countries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Countries</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Select countries"
                  options={countries.map((country) => ({
                    label: country.name,
                    value: country.code,
                  }))}
                  selected={field.value.map((code) => ({
                    label: countries.find((c) => c.code === code)?.name || code,
                    value: code,
                  }))}
                  onChange={(selected) =>
                    field.onChange(selected.map((item) => item.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="regions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regions (Optional)</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Enter regions"
                  options={[]}
                  selected={field.value.map((region) => ({
                    label: region,
                    value: region,
                  }))}
                  onChange={(selected) =>
                    field.onChange(selected.map((item) => item.value))
                  }
                  creatable
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postal_codes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Codes (Optional)</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Enter postal codes"
                  options={[]}
                  selected={field.value.map((code) => ({
                    label: code,
                    value: code,
                  }))}
                  onChange={(selected) =>
                    field.onChange(selected.map((item) => item.value))
                  }
                  creatable
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
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  Enable or disable this shipping zone
                </div>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Zone"}
        </Button>
      </form>
    </Form>
  );
} 