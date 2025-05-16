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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type Employee, type DeductionDetail, type PayRunEmployee, type PayRun, type CompanySettings } from "@/app/types/payroll";

export default function PayRunDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payRun, setPayRun] = useState<PayRun | null>(null);
  const [employees, setEmployees] = useState<PayRunEmployee[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          toast.error("Please sign in to view pay run details");
          router.push("/sign-in");
          return;
        }

        // Fetch company settings
        const { data: settingsData } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setCompanySettings(settingsData);

        // Fetch pay run details
        const { data: payRunData, error: payRunError } = await supabase
          .from("pay_runs")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (payRunError) {
          console.error("Error fetching pay run:", payRunError);
          toast.error("Failed to load pay run details");
          return;
        }

        setPayRun(payRunData);

        // First fetch pay run employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("pay_run_employees")
          .select(
            `
            *,
            employee:employees(*),
            deduction_details:pay_run_deductions(*)
          `,
          )
          .eq("pay_run_id", params.id)
          .eq("user_id", user.id);

        if (employeesError) {
          console.error("Error fetching pay run employees:", employeesError);
          toast.error("Failed to load employee details");
          return;
        }

        // Transform the data to match PayRunEmployee type
        const transformedEmployees = employeesData?.map((entry) => ({
          ...entry,
          employee: entry.employee || undefined,
          deduction_details: entry.deduction_details || []
        })) || [];

        setEmployees(transformedEmployees);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const formatAmount = (amount: number) => {
    const currency = companySettings?.default_currency || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleStatusChange = async (
    newStatus: "processing" | "completed" | "cancelled",
  ) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to update the pay run");
        return;
      }

      const { error } = await supabase
        .from("pay_runs")
        .update({ status: newStatus })
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Pay run ${newStatus} successfully`);

      // Refresh the data by reloading the page
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update pay run status");
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading pay run details..." />
        </div>
      </DashboardWrapper>
    );
  }

  if (!payRun) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Pay Run Not Found</h2>
          <Button onClick={() => router.push("/dashboard/payroll/pay-runs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pay Runs
          </Button>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/payroll/pay-runs")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Pay Run Details</h1>
              <p className="text-sm text-muted-foreground">
                View and manage pay run information
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {payRun.status === "draft" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("processing")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Process
              </Button>
            )}
            {payRun.status === "processing" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("completed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            {(payRun.status === "draft" || payRun.status === "processing") && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("cancelled")}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            {payRun.status === "completed" && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {format(new Date(payRun.period_start), "MMM d, yyyy")} -{" "}
                {format(new Date(payRun.period_end), "MMM d, yyyy")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Date
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {format(new Date(payRun.payment_date), "MMM d, yyyy")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(payRun.status)}>
                {payRun.status.charAt(0).toUpperCase() + payRun.status.slice(1)}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payRun.total_employees}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
            <CardDescription>
              Breakdown of pay for each employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Base Pay</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {employee.employee?.first_name || 'N/A'}{" "}
                          {employee.employee?.last_name || ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employee?.email || 'No email'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.employee?.position || 'N/A'}</TableCell>
                    <TableCell>{employee.employee?.department || 'N/A'}</TableCell>
                    <TableCell>{formatAmount(employee.base_pay)}</TableCell>
                    <TableCell>{formatAmount(employee.overtime_pay)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0">
                            {formatAmount(employee.deductions)}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Deduction Details</DialogTitle>
                            <DialogDescription>
                              Breakdown of deductions for{" "}
                              {employee.employee?.first_name || 'N/A'}{" "}
                              {employee.employee?.last_name || ''}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {employee.deduction_details.map((deduction) => (
                              <div
                                key={deduction.id}
                                className="flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-medium capitalize">
                                    {deduction.type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {deduction.description}
                                  </p>
                                </div>
                                <p className="font-medium">
                                  {formatAmount(deduction.amount)}
                                </p>
                              </div>
                            ))}
                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <p className="font-bold">Total Deductions</p>
                                <p className="font-bold">
                                  {formatAmount(employee.deductions)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>{formatAmount(employee.net_pay)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Total amounts for this pay run</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Gross Pay:</span>
                <span className="font-bold">
                  {formatAmount(payRun.total_gross)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Deductions:</span>
                <span className="font-bold">
                  {formatAmount(payRun.total_deductions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Net Pay:</span>
                <span className="font-bold">
                  {formatAmount(payRun.total_net)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
