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
  overtime_rate: z.string().min(1, "Overtime rate is required"),
  tax_rate: z.string().min(1, "Tax rate is required"),
  enable_overtime: z.boolean(),
  enable_bonuses: z.boolean(),
  enable_deductions: z.boolean(),
  default_work_hours: z.string().min(1, "Default work hours is required"),
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
    .min(1, "Default 401k contribution is required"),
  enable_health_insurance: z.boolean(),
  default_health_insurance_deduction: z
    .string()
    .min(1, "Default health insurance deduction is required"),
});

type PayrollSettingsFormValues = {
  pay_schedule: "weekly" | "bi_weekly" | "monthly";
  pay_day: string;
  overtime_rate: string;
  tax_rate: string;
  enable_overtime: boolean;
  enable_bonuses: boolean;
  enable_deductions: boolean;
  default_work_hours: string;
  holiday_pay_rate: string;
  sick_leave_accrual_rate: string;
  vacation_leave_accrual_rate: string;
  enable_holiday_pay: boolean;
  enable_sick_leave: boolean;
  enable_vacation_leave: boolean;
  enable_401k: boolean;
  default_401k_contribution: string;
  enable_health_insurance: boolean;
  default_health_insurance_deduction: string;
};

export default function PayrollSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<PayrollSettingsFormValues>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      pay_schedule: "monthly",
      pay_day: "1",
      overtime_rate: "1.5",
      tax_rate: "20",
      enable_overtime: true,
      enable_bonuses: true,
      enable_deductions: true,
      default_work_hours: "40",
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
          // Convert numeric values to strings for the form
          const formData = {
            pay_schedule: data.pay_schedule,
            pay_day: data.pay_day.toString(),
            overtime_rate: data.overtime_rate.toString(),
            tax_rate: data.tax_rate.toString(),
            enable_overtime: data.enable_overtime,
            enable_bonuses: data.enable_bonuses,
            enable_deductions: data.enable_deductions,
            default_work_hours: data.default_work_hours.toString(),
            holiday_pay_rate: data.holiday_pay_rate?.toString() || "1.5",
            sick_leave_accrual_rate: data.sick_leave_accrual_rate?.toString() || "0.0385",
            vacation_leave_accrual_rate: data.vacation_leave_accrual_rate?.toString() || "0.0385",
            enable_holiday_pay: data.enable_holiday_pay ?? true,
            enable_sick_leave: data.enable_sick_leave ?? true,
            enable_vacation_leave: data.enable_vacation_leave ?? true,
            enable_401k: data.enable_401k ?? true,
            default_401k_contribution: data.default_401k_contribution?.toString() || "6",
            enable_health_insurance: data.enable_health_insurance ?? true,
            default_health_insurance_deduction: data.default_health_insurance_deduction?.toString() || "200",
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

      // Convert string values to numbers for the database
      const dbData = {
        user_id: user.id,
        pay_schedule: formData.pay_schedule,
        pay_day: formData.pay_day,
        overtime_rate: parseFloat(formData.overtime_rate),
        tax_rate: parseFloat(formData.tax_rate),
        enable_overtime: formData.enable_overtime,
        enable_bonuses: formData.enable_bonuses,
        enable_deductions: formData.enable_deductions,
        default_work_hours: parseFloat(formData.default_work_hours),
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
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="leave">Leave & Benefits</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Set up your basic payroll configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  <SelectValue placeholder="Select pay schedule" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="bi_weekly">
                                  Bi-Weekly
                                </SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How often employees are paid
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
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Day of the month/week when salaries are paid
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="overtime_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overtime Rate</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Multiplier for overtime hours (e.g., 1.5 for time
                              and a half)
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
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Default tax rate for salary calculations
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="default_work_hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Work Hours (Weekly)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Standard work hours per week
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="enable_overtime"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Overtime</FormLabel>
                              <FormDescription>
                                Allow overtime calculations in payroll
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
                        name="enable_bonuses"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Bonuses</FormLabel>
                              <FormDescription>
                                Allow bonus payments in payroll
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
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card>
              <CardHeader>
                <CardTitle>Leave & Benefits</CardTitle>
                <CardDescription>
                  Configure leave policies and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="holiday_pay_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Holiday Pay Rate</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Multiplier for holiday hours (e.g., 1.5 for time
                              and a half)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sick_leave_accrual_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Sick Leave Accrual Rate (days/month)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of sick leave days accrued per month
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vacation_leave_accrual_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Vacation Leave Accrual Rate (days/month)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of vacation days accrued per month
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="enable_holiday_pay"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Holiday Pay</FormLabel>
                              <FormDescription>
                                Apply holiday pay rate for holiday hours
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
                        name="enable_sick_leave"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Sick Leave</FormLabel>
                              <FormDescription>
                                Allow sick leave accrual and usage
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
                        name="enable_vacation_leave"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Vacation Leave</FormLabel>
                              <FormDescription>
                                Allow vacation leave accrual and usage
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
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deductions">
            <Card>
              <CardHeader>
                <CardTitle>Deductions</CardTitle>
                <CardDescription>
                  Configure salary deductions and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="default_401k_contribution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Default 401(k) Contribution (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Default percentage of salary for 401(k)
                              contributions
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="default_health_insurance_deduction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Default Health Insurance Deduction ($)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Default monthly health insurance premium deduction
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="enable_401k"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable 401(k)</FormLabel>
                              <FormDescription>
                                Allow 401(k) contributions and deductions
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
                        name="enable_health_insurance"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Health Insurance</FormLabel>
                              <FormDescription>
                                Allow health insurance premium deductions
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
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
