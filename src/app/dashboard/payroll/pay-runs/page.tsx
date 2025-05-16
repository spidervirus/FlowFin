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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Download,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Receipt,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database } from "@/types/supabase";
import { type Employee, type PayrollSettings, type CompanySettings, type PayRun, type PayRunSummary, type NewPayRun } from "@/app/types/payroll";

export default function PayRunsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [payrollSettings, setPayrollSettings] =
    useState<PayrollSettings | null>(null);
  const [summary, setSummary] = useState<PayRunSummary | null>(null);
  const [isNewPayRunDialogOpen, setIsNewPayRunDialogOpen] = useState(false);
  const [newPayRun, setNewPayRun] = useState({
    period_start: "",
    period_end: "",
    payment_date: "",
  });

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        toast.error("Authentication error. Please sign in again.");
        router.push("/sign-in");
        return;
      }

      if (!user) {
        toast.error("Please sign in to view pay runs");
        router.push("/sign-in");
        return;
      }

      // Fetch company settings
      const { data: companySettingsData, error: companySettingsError } =
        await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (companySettingsError) {
        console.error("Company settings error:", companySettingsError);
        toast.error("Failed to load company settings");
        return;
      }

      if (!companySettingsData) {
        // Create default company settings if none exist
        const { data: newCompanySettings, error: createCompanyError } =
          await supabase
            .from("company_settings")
            .upsert({
              user_id: user.id,
              company_name: "My Company",
              address: "",
              country: "United States",
              default_currency: "USD",
              fiscal_year_start: "01",
              industry: "Technology",
            })
            .select()
            .single();

        if (createCompanyError) {
          console.error("Error creating company settings:", createCompanyError);
          toast.error("Failed to create company settings");
          return;
        }
        setCompanySettings(newCompanySettings);
      } else {
        setCompanySettings(companySettingsData);
      }

      // Fetch payroll settings
      const { data: payrollSettingsData, error: payrollSettingsError } =
        await supabase
          .from("payroll_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (payrollSettingsError) {
        console.error("Payroll settings error:", payrollSettingsError);
        toast.error("Failed to load payroll settings");
        return;
      }

      if (!payrollSettingsData) {
        // Create default payroll settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from("payroll_settings")
          .upsert({
            user_id: user.id,
            pay_schedule: "monthly",
            pay_day: "last",
            overtime_rate: 1.5,
            tax_rate: 20.0,
            enable_overtime: true,
            enable_bonuses: true,
            enable_deductions: true,
            default_work_hours: 40,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating payroll settings:", createError);
          toast.error("Failed to create payroll settings");
          return;
        }
        setPayrollSettings(newSettings as PayrollSettings);
      } else {
        setPayrollSettings(payrollSettingsData as PayrollSettings);
      }

      // Fetch employees count
      const { count: employeesCount, error: employeesError } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (employeesError) {
        console.error("Error fetching employees:", employeesError);
      }

      // Fetch pay runs with fresh data
      const { data: payRunsData, error: payRunsError } = await supabase
        .from("pay_runs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (payRunsError) {
        console.error("Pay runs error:", payRunsError);
        toast.error("Failed to load pay runs");
        return;
      }

      if (!payRunsData) {
        console.log("No pay runs data found");
        setPayRuns([]);
        return;
      }

      // Log individual pay runs for debugging
      payRunsData.forEach((run) => {
        console.log(`Pay Run:`, {
          id: run.id,
          status: run.status,
          period: `${run.period_start} to ${run.period_end}`,
          amounts: {
            total_gross: run.total_gross,
            total_deductions: run.total_deductions,
            total_net: run.total_net,
          },
        });
      });

      setPayRuns(payRunsData);

      // Calculate summary with fresh data
      const summary = {
        total_pay_runs: payRunsData.length,
        total_employees: employeesCount || 0,
        total_gross_pay: payRunsData.reduce(
          (acc, run) => acc + (run.total_gross || 0),
          0,
        ),
        total_deductions: payRunsData.reduce(
          (acc, run) => acc + (run.total_deductions || 0),
          0,
        ),
        total_net_pay: payRunsData.reduce(
          (acc, run) => acc + (run.total_net || 0),
          0,
        ),
        average_net_pay:
          payRunsData.length > 0
            ? payRunsData.reduce((acc, run) => acc + (run.total_net || 0), 0) /
              payRunsData.length
            : 0,
      };

      setSummary(summary);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const refreshData = async () => {
    setLoading(true);
    await fetchData();
  };

  const handleCreatePayRun = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to create a pay run");
        return;
      }

      if (!payrollSettings) {
        toast.error("Please configure payroll settings first");
        return;
      }

      // Validate dates
      if (
        !newPayRun.period_start ||
        !newPayRun.period_end ||
        !newPayRun.payment_date
      ) {
        toast.error("Please fill in all date fields");
        return;
      }

      const startDate = new Date(newPayRun.period_start);
      const endDate = new Date(newPayRun.period_end);
      const paymentDate = new Date(newPayRun.payment_date);

      // Basic date validation
      if (startDate >= endDate) {
        toast.error("Period start date must be before end date");
        return;
      }

      if (paymentDate <= endDate) {
        toast.error("Payment date must be after period end date");
        return;
      }

      // Fetch active employees
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (employeesError) {
        console.error("Error fetching employees:", employeesError);
        toast.error("Failed to fetch employees");
        return;
      }

      if (!employees || employees.length === 0) {
        toast.error("No active employees found");
        return;
      }

      // Calculate total amounts
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      // Create the pay run
      const { data: payRun, error: createError } = await supabase
        .from("pay_runs")
        .insert([
          {
            user_id: user.id,
            period_start: newPayRun.period_start,
            period_end: newPayRun.period_end,
            payment_date: newPayRun.payment_date,
            status: "draft",
            total_employees: employees.length,
            total_gross: 0,
            total_deductions: 0,
            total_net: 0,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("Error creating pay run:", createError);
        toast.error("Failed to create pay run");
        return;
      }

      // Create pay run entries for each employee
      for (const employee of employees) {
        const basePay = employee.salary || 0;
        const taxDeduction = basePay * (payrollSettings?.tax_rate || 20) / 100;
        const totalDeduction = taxDeduction;
        const netPay = basePay - totalDeduction;

        totalGross += basePay;
        totalDeductions += totalDeduction;
        totalNet += netPay;

        // Create pay run employee entry
        const { data: payRunEmployee, error: entryError } = await supabase
          .from("pay_run_employees")
          .insert([
            {
              user_id: user.id,
              pay_run_id: payRun.id,
              employee_id: employee.id,
              base_pay: basePay,
              overtime_pay: 0,
              deductions: totalDeduction,
              net_pay: netPay,
            },
          ])
          .select()
          .single();

        if (entryError) {
          console.error("Error creating pay run entry:", entryError);
          continue;
        }

        // Create deduction details
        const { error: deductionError } = await supabase
          .from("pay_run_deductions")
          .insert([
            {
              user_id: user.id,
              pay_run_employee_id: payRunEmployee.id,
              type: "tax",
              description: `Income Tax (${payrollSettings?.tax_rate || 20}%)`,
              amount: taxDeduction,
            },
          ]);

        if (deductionError) {
          console.error("Error creating deduction details:", deductionError);
        }
      }

      // Update pay run with totals
      const { error: updateError } = await supabase
        .from("pay_runs")
        .update({
          total_gross: totalGross,
          total_deductions: totalDeductions,
          total_net: totalNet,
        })
        .eq("id", payRun.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating pay run totals:", updateError);
        toast.error("Failed to update pay run totals");
        return;
      }

      toast.success("Pay run created successfully");
      setIsNewPayRunDialogOpen(false);
      setNewPayRun({
        period_start: "",
        period_end: "",
        payment_date: "",
      });

      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create pay run");
    }
  };

  const handleStatusChange = async (
    payRunId: string,
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
        .eq("id", payRunId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Pay run ${newStatus} successfully`);

      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update pay run status");
    }
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

  const formatAmount = (amount: number) => {
    const currency = companySettings?.default_currency || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading pay runs..." />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pay Runs</h1>
            <p className="text-sm text-muted-foreground">
              Manage payroll processing and payments
            </p>
          </div>
          <Dialog
            open={isNewPayRunDialogOpen}
            onOpenChange={setIsNewPayRunDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Pay Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Pay Run</DialogTitle>
                <DialogDescription>
                  Create a new pay run for processing payroll
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period Start</Label>
                    <Input
                      type="date"
                      value={newPayRun.period_start}
                      onChange={(e) =>
                        setNewPayRun({
                          ...newPayRun,
                          period_start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period End</Label>
                    <Input
                      type="date"
                      value={newPayRun.period_end}
                      onChange={(e) =>
                        setNewPayRun({
                          ...newPayRun,
                          period_end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={newPayRun.payment_date}
                    onChange={(e) =>
                      setNewPayRun({
                        ...newPayRun,
                        payment_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNewPayRunDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePayRun}>Create Pay Run</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pay Runs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.total_pay_runs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total number of pay runs processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(summary?.total_gross_pay || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total gross pay across all pay runs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(summary?.total_net_pay || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total net pay across all pay runs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Net Pay</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(summary?.average_net_pay || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average net pay per pay run
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Pay Runs</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pay Runs</CardTitle>
                <CardDescription>View and manage all pay runs</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payRuns.map((payRun) => (
                        <TableRow key={payRun.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(payRun.period_start), "MMM d")}{" "}
                                -{" "}
                                {format(
                                  new Date(payRun.period_end),
                                  "MMM d, yyyy",
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(payRun.payment_date),
                              "MMM d, yyyy",
                            )}
                          </TableCell>
                          <TableCell>{payRun.total_employees}</TableCell>
                          <TableCell>
                            {formatAmount(payRun.total_gross)}
                          </TableCell>
                          <TableCell>
                            {formatAmount(payRun.total_deductions)}
                          </TableCell>
                          <TableCell>
                            {formatAmount(payRun.total_net)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(payRun.status)}>
                              {payRun.status.charAt(0).toUpperCase() +
                                payRun.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {payRun.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(payRun.id, "processing")
                                  }
                                >
                                  Process
                                </Button>
                              )}
                              {payRun.status === "processing" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(payRun.id, "completed")
                                  }
                                >
                                  Complete
                                </Button>
                              )}
                              {(payRun.status === "draft" ||
                                payRun.status === "processing") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(payRun.id, "cancelled")
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/payroll/pay-runs/${payRun.id}`,
                                  )
                                }
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
