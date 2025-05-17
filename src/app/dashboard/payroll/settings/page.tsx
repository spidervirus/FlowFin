"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import DashboardWrapper from "../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";
import { type PayrollSettings } from "@/app/types/payroll";

const payrollSettingsSchema = z.object({
  pay_schedule: z.enum(["weekly", "bi_weekly", "monthly"]),
  pay_day: z.string().min(1, "Pay day is required"),
  enable_overtime: z.boolean(),
  enable_bonuses: z.boolean(),
  enable_deductions: z.boolean(),
  overtime_rate: z.string().min(1, "Overtime rate is required"),
  tax_rate: z.string().min(1, "Tax rate is required"),
  overtime_threshold: z.string().min(1, "Overtime threshold (weekly hours) is required"),
  holiday_pay_rate: z.string().min(1, "Holiday pay rate is required"),
  sick_leave_accrual_rate: z
    .string()
    .min(1, "Sick leave accrual rate is required"),
  vacation_leave_accrual_rate: z
    .string()
    .min(1, "Vacation leave accrual rate is required"),
  enable_holiday_pay: z.boolean(),
  enable_sick_leave: z.boolean(),
  enable_vacation_leave: z.boolean(),
  enable_401k: z.boolean(),
  default_401k_contribution: z
    .string()
    .min(1, "Default 401k contribution (%) is required"),
  enable_health_insurance: z.boolean(),
  default_health_insurance_deduction: z
    .string()
    .min(1, "Default health insurance deduction ($) is required"),
});

// Derive the form values type from the Zod schema to ensure they are always in sync
type PayrollSettingsFormValues = z.infer<typeof payrollSettingsSchema>;

export default function PayrollSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<PayrollSettingsFormValues>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      pay_schedule: "monthly",
      pay_day: "1",
      enable_overtime: true,
      enable_bonuses: true,
      enable_deductions: true,
      overtime_rate: "1.5",
      tax_rate: "20",
      overtime_threshold: "40",
      holiday_pay_rate: "1.5",
      sick_leave_accrual_rate: "0.0385",
      vacation_leave_accrual_rate: "0.0385",
      enable_holiday_pay: true,
      enable_sick_leave: true,
      enable_vacation_leave: true,
      enable_401k: true,
      default_401k_contribution: "6",
      enable_health_insurance: true,
      default_health_insurance_deduction: "200",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to view settings");
          return;
        }

        const { data, error } = await supabase
          .from("payroll_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No settings found, use defaults
            return;
          }
          throw error;
        }

        if (data) {
          // Map DB data to form fields, using correct DB column names
          const formData: PayrollSettingsFormValues = {
            pay_schedule: (data.pay_schedule as PayrollSettingsFormValues['pay_schedule']) ?? form.formState.defaultValues.pay_schedule!,
            pay_day: data.pay_day?.toString() ?? form.formState.defaultValues.pay_day!,
            enable_overtime: data.enable_overtime !== undefined && data.enable_overtime !== null ? !!data.enable_overtime : form.formState.defaultValues.enable_overtime!,
            enable_bonuses: data.enable_bonuses !== undefined && data.enable_bonuses !== null ? !!data.enable_bonuses : form.formState.defaultValues.enable_bonuses!,
            enable_deductions: data.enable_deductions !== undefined && data.enable_deductions !== null ? !!data.enable_deductions : form.formState.defaultValues.enable_deductions!,
            overtime_rate: data.overtime_rate?.toString() ?? form.formState.defaultValues.overtime_rate!,
            tax_rate: data.tax_rate?.toString() ?? form.formState.defaultValues.tax_rate!,
            overtime_threshold: data.overtime_threshold?.toString() ?? form.formState.defaultValues.overtime_threshold!,
            holiday_pay_rate: data.holiday_pay_rate?.toString() ?? form.formState.defaultValues.holiday_pay_rate!,
            sick_leave_accrual_rate: data.sick_leave_accrual_rate?.toString() ?? form.formState.defaultValues.sick_leave_accrual_rate!,
            vacation_leave_accrual_rate: data.vacation_leave_accrual_rate?.toString() ?? form.formState.defaultValues.vacation_leave_accrual_rate!,
            enable_holiday_pay: data.enable_holiday_pay !== undefined && data.enable_holiday_pay !== null ? !!data.enable_holiday_pay : form.formState.defaultValues.enable_holiday_pay!,
            enable_sick_leave: data.enable_sick_leave !== undefined && data.enable_sick_leave !== null ? !!data.enable_sick_leave : form.formState.defaultValues.enable_sick_leave!,
            enable_vacation_leave: data.enable_vacation_leave !== undefined && data.enable_vacation_leave !== null ? !!data.enable_vacation_leave : form.formState.defaultValues.enable_vacation_leave!,
            enable_401k: data.enable_401k !== undefined && data.enable_401k !== null ? !!data.enable_401k : form.formState.defaultValues.enable_401k!,
            default_401k_contribution: data.default_401k_contribution?.toString() ?? form.formState.defaultValues.default_401k_contribution!,
            enable_health_insurance: data.enable_health_insurance !== undefined && data.enable_health_insurance !== null ? !!data.enable_health_insurance : form.formState.defaultValues.enable_health_insurance!,
            default_health_insurance_deduction: data.default_health_insurance_deduction?.toString() ?? form.formState.defaultValues.default_health_insurance_deduction!,
          };
          form.reset(formData);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [form]);

  async function onSubmit(formData: PayrollSettingsFormValues) {
    try {
      setSaving(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to save settings");
        return;
      }

      // Convert string values from form to numbers/correct types for the database
      // Ensure keys here match the Zod schema / actual DB column names
      const dbData = {
        user_id: user.id,
        pay_schedule: formData.pay_schedule,
        pay_day: formData.pay_day,
        enable_overtime: formData.enable_overtime,
        enable_bonuses: formData.enable_bonuses,
        enable_deductions: formData.enable_deductions,
        overtime_rate: parseFloat(formData.overtime_rate),
        tax_rate: parseFloat(formData.tax_rate),
        overtime_threshold: parseInt(formData.overtime_threshold, 10),
        holiday_pay_rate: parseFloat(formData.holiday_pay_rate),
        sick_leave_accrual_rate: parseFloat(formData.sick_leave_accrual_rate),
        vacation_leave_accrual_rate: parseFloat(formData.vacation_leave_accrual_rate),
        enable_holiday_pay: formData.enable_holiday_pay,
        enable_sick_leave: formData.enable_sick_leave,
        enable_vacation_leave: formData.enable_vacation_leave,
        enable_401k: formData.enable_401k,
        default_401k_contribution: parseFloat(formData.default_401k_contribution),
        enable_health_insurance: formData.enable_health_insurance,
        default_health_insurance_deduction: parseFloat(formData.default_health_insurance_deduction),
      };

      const { error } = await supabase
        .from("payroll_settings")
        .upsert([dbData], {
          onConflict: "user_id",
        });

      if (error) throw error;

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payroll Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your payroll preferences and calculations
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Changes to these settings will affect future payroll calculations.
            Existing payroll records will not be affected.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="rates">Rates & Thresholds</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
          </TabsList>

          <Separator />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pay Schedule</CardTitle>
                    <CardDescription>
                      Configure how often employees are paid.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pay_schedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Schedule</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a pay schedule" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi_weekly">
                                Bi-weekly
                              </SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose how frequently payroll is processed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pay_day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Day</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Friday or 15" {...field} />
                          </FormControl>
                          <FormDescription>
                            Specify the day of the week (for weekly/bi-weekly) or
                            day of the month (for monthly) that employees are
                            paid.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rates" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overtime & Tax</CardTitle>
                    <CardDescription>
                      Set rates for overtime and general tax.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enable_overtime"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Overtime
                            </FormLabel>
                            <FormDescription>
                              Allow employees to accrue overtime pay.
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
                    <FormField
                      control={form.control}
                      name="overtime_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overtime Rate Multiplier</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 1.5" {...field} />
                          </FormControl>
                          <FormDescription>
                            Multiplier for regular pay rate for overtime hours (e.g., 1.5 for time and a half).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="overtime_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overtime Threshold (Weekly Hours)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 40" {...field} />
                          </FormControl>
                          <FormDescription>
                           Number of hours per week after which overtime pay applies.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tax_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 20" {...field} />
                          </FormControl>
                          <FormDescription>
                            Default overall tax rate percentage. Specific tax calculations may vary.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leave" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Policies</CardTitle>
                    <CardDescription>
                      Configure settings for various types of employee leave.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enable_holiday_pay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Holiday Pay
                            </FormLabel>
                            <FormDescription>
                              Activate special pay rates for holidays.
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
                    <FormField
                      control={form.control}
                      name="holiday_pay_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Holiday Pay Rate Multiplier</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 2.0" {...field} />
                          </FormControl>
                           <FormDescription>
                            Multiplier for regular pay rate for work on holidays (e.g., 2.0 for double time).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator />
                     <FormField
                      control={form.control}
                      name="enable_sick_leave"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Sick Leave
                            </FormLabel>
                            <FormDescription>
                              Allow employees to accrue and use sick leave.
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
                    <FormField
                      control={form.control}
                      name="sick_leave_accrual_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sick Leave Accrual Rate (Hours per Hour Worked)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" placeholder="e.g., 0.0385 for 1 hour per 26 hours worked" {...field} />
                          </FormControl>
                          <FormDescription>
                            Rate at which sick leave is accrued. For example, 0.0385 hours of sick leave per hour worked.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator />
                    <FormField
                      control={form.control}
                      name="enable_vacation_leave"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Vacation Leave
                            </FormLabel>
                            <FormDescription>
                               Allow employees to accrue and use vacation leave.
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
                    <FormField
                      control={form.control}
                      name="vacation_leave_accrual_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vacation Accrual Rate (Hours per Hour Worked)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" placeholder="e.g., 0.0385 for 1 hour per 26 hours worked" {...field} />
                          </FormControl>
                          <FormDescription>
                             Rate at which vacation leave is accrued. For example, 0.0385 hours of vacation leave per hour worked.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="benefits" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Deductions</CardTitle>
                    <CardDescription>
                      Manage settings for 401(k), health insurance, and other deductions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enable_bonuses"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Bonuses</FormLabel>
                            <FormDescription>
                              Allow bonuses to be added to payroll.
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
                    <FormField
                      control={form.control}
                      name="enable_deductions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable General Deductions</FormLabel>
                            <FormDescription>
                              Allow general deductions to be applied to payroll.
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
                    <Separator />
                    <FormField
                      control={form.control}
                      name="enable_401k"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable 401(k) Contributions
                            </FormLabel>
                            <FormDescription>
                              Allow employees to contribute to a 401(k) plan.
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
                    <FormField
                      control={form.control}
                      name="default_401k_contribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default 401(k) Contribution Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 6" {...field} />
                          </FormControl>
                          <FormDescription>
                            Default percentage of gross pay contributed to 401(k) if an employee opts in.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator />
                     <FormField
                      control={form.control}
                      name="enable_health_insurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Health Insurance Deductions
                            </FormLabel>
                            <FormDescription>
                              Allow deductions for health insurance premiums.
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
                    <FormField
                      control={form.control}
                      name="default_health_insurance_deduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Health Insurance Deduction ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 200" {...field} />
                          </FormControl>
                           <FormDescription>
                            Default amount deducted per pay period for health insurance.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <LoadingSpinner text="Saving..." />
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
