"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import DashboardWrapper from "../../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, FileText, Play, CheckCircle } from "lucide-react";
import Link from "next/link";
import { type Employee, type Payslip, type PayrollPeriod, type CompanySettings } from "@/app/types/payroll";
import { type Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];
type PayslipInsert = Tables["payslips"]["Insert"];
type PayslipUpdate = Tables["payslips"]["Update"];
type PayrollPeriodUpdate = Tables["payroll_periods"]["Update"];

export default function PayrollPeriodPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to view payroll period");
          return;
        }

        // Fetch company settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
        } else {
          setSettings(settingsData);
        }

        // Fetch payroll period
        const { data: periodData, error: periodError } = await supabase
          .from("payroll_periods")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (periodError) throw periodError;

        setPeriod(periodData);

        // Fetch active employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (employeesError) throw employeesError;

        setEmployees(employeesData || []);

        // Fetch payslips for this period
        const { data: payslipsData, error: payslipsError } = await supabase
          .from("payslips")
          .select("*")
          .eq("payroll_period_id", params.id)
          .eq("user_id", user.id);

        if (payslipsError) throw payslipsError;

        setPayslips(payslipsData || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading payroll period");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  const formatAmount = (amount: number) => {
    if (typeof amount !== "number" || isNaN(amount)) {
      amount = 0;
    }

    if (!settings?.default_currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings.default_currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (
    status: PayrollPeriod["status"] | Payslip["status"],
  ) => {
    switch (status) {
      case "draft":
        return "default";
      case "processing":
        return "secondary";
      case "completed":
      case "approved":
      case "paid":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  async function onDelete() {
    try {
      setDeleting(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to delete payroll period");
        return;
      }

      const { error } = await supabase
        .from("payroll_periods")
        .delete()
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Payroll period deleted successfully");
      router.push("/dashboard/payroll/periods");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error deleting payroll period");
    } finally {
      setDeleting(false);
    }
  }

  async function generatePayslips() {
    try {
      setProcessing(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to generate payslips");
        return;
      }

      // Update period status to processing
      const { error: periodError } = await supabase
        .from("payroll_periods")
        .update({ status: "processing" })
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (periodError) throw periodError;

      // Generate payslips for all active employees
      const payslipsToInsert: PayslipInsert[] = employees.map((employee) => ({
        user_id: user.id,
        employee_id: employee.id,
        payroll_period_id: params.id,
        base_salary: employee.salary / 12, // Monthly salary
        gross_pay: employee.salary / 12,
        deductions: 0, // You might want to calculate this based on your rules
        net_pay: employee.salary / 12,
        status: "draft",
      }));

      const { error: payslipsError } = await supabase
        .from("payslips")
        .insert(payslipsToInsert);

      if (payslipsError) throw payslipsError;

      toast.success("Payslips generated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error generating payslips");
    } finally {
      setProcessing(false);
    }
  }

  async function completePayroll() {
    try {
      setProcessing(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to complete payroll");
        return;
      }

      // Update period status to completed
      const periodUpdate: PayrollPeriodUpdate = {
        status: "completed"
      };

      const { error: periodError } = await supabase
        .from("payroll_periods")
        .update(periodUpdate)
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (periodError) throw periodError;

      // Update all payslips to approved
      const payslipUpdate: PayslipUpdate = {
        status: "approved",
        payment_date: new Date().toISOString(),
      };

      const { error: payslipsError } = await supabase
        .from("payslips")
        .update(payslipUpdate)
        .eq("payroll_period_id", params.id)
        .eq("user_id", user.id);

      if (payslipsError) throw payslipsError;

      toast.success("Payroll completed successfully");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error completing payroll");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!period) {
    return (
      <DashboardWrapper>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">Payroll period not found</h3>
          <p className="text-sm text-gray-500 mt-2">
            The payroll period you're looking for doesn't exist or you don't
            have access to it.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/payroll/periods">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payroll Periods
              </Button>
            </Link>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/payroll/periods">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payroll Periods
              </Button>
            </Link>
          </div>
          {period.status === "draft" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Period"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the payroll period and all associated payslips.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Payroll Period Details</CardTitle>
                <CardDescription>
                  {new Date(period.start_date).toLocaleDateString()} -{" "}
                  {new Date(period.end_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={getStatusColor(period.status)}>
                {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Period Status</p>
                  <p className="text-sm text-muted-foreground">
                    {period.status === "draft" && "Ready to generate payslips"}
                    {period.status === "processing" && "Processing payslips"}
                    {period.status === "completed" && "All payslips processed"}
                    {period.status === "cancelled" && "Period cancelled"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {period.status === "draft" && (
                    <Button
                      onClick={generatePayslips}
                      disabled={processing || employees.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {processing ? "Generating..." : "Generate Payslips"}
                    </Button>
                  )}
                  {period.status === "processing" && (
                    <Button
                      onClick={completePayroll}
                      disabled={processing || payslips.length === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing ? "Completing..." : "Complete Payroll"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Payslips</h3>
                {payslips.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No payslips
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {period.status === "draft"
                        ? "Generate payslips to get started"
                        : "No payslips found for this period"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Base Salary</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.map((payslip) => {
                        const employee = employees.find(
                          (e) => e.id === payslip.employee_id,
                        );
                        return (
                          <TableRow key={payslip.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {employee
                                    ? `${employee.first_name} ${employee.last_name}`
                                    : "Unknown Employee"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {employee?.position}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatAmount(payslip.base_salary)}
                            </TableCell>
                            <TableCell>
                              {formatAmount(payslip.gross_pay)}
                            </TableCell>
                            <TableCell>
                              {formatAmount(payslip.deductions)}
                            </TableCell>
                            <TableCell>
                              {formatAmount(payslip.net_pay)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(payslip.status)}>
                                {payslip.status.charAt(0).toUpperCase() +
                                  payslip.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/dashboard/payroll/payslips/${payslip.id}`}
                              >
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
