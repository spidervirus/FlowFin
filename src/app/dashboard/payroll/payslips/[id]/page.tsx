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
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { type Employee, type PayrollPeriod, type PayslipItem, type CompanySettings, type Payslip } from "@/app/types/payroll";
import { type Database } from "@/types/supabase";
import { CurrencyCode } from "@/lib/utils";

export default function PayslipPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [items, setItems] = useState<PayslipItem[]>([]);
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
          toast.error("Please sign in to view payslip");
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
          setSettings(null);
        } else if (settingsData) {
          const transformedSettings: CompanySettings = {
            id: settingsData.id,
            user_id: settingsData.user_id,
            company_name: settingsData.company_name ?? "N/A",
            address: (settingsData as any).address ?? "Default Address",
            default_currency: (settingsData.default_currency as CurrencyCode) ?? "USD",
            fiscal_year_start: settingsData.fiscal_year_start ?? "01-01",
            industry: (settingsData as any).industry ?? "General",
            phone_number: (settingsData as any).phone_number ?? "N/A",
            company_size: (settingsData as any).company_size ?? "1-10",
            created_at: settingsData.created_at,
            updated_at: settingsData.updated_at,
            organization_id: (settingsData as any).organization_id ?? "MISSING_ORG_ID",
            tax_year_start: (settingsData as any).tax_year_start ?? "01-01",
          };
          setSettings(transformedSettings);
        } else {
          setSettings(null);
        }

        // Fetch payslip
        const { data: payslipData, error: payslipError } = await supabase
          .from("payslips")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (payslipError) throw payslipError;

        const validPayslipStatuses = ["draft", "approved", "paid"] as const;
        type ValidPayslipStatus = typeof validPayslipStatuses[number];
        const transformedPayslip: Payslip = {
          id: payslipData.id,
          user_id: payslipData.user_id,
          employee_id: payslipData.employee_id,
          pay_run_id: payslipData.pay_run_id,
          gross_pay: payslipData.gross_pay,
          deductions: payslipData.deductions,
          net_pay: payslipData.net_pay,
          status: validPayslipStatuses.includes(payslipData.status as any) 
              ? (payslipData.status as ValidPayslipStatus) 
              : "draft",
          payment_date: payslipData.payment_date,
          created_at: payslipData.created_at,
          updated_at: payslipData.updated_at,
          period_start: payslipData.period_start,
          period_end: payslipData.period_end,
        };
        setPayslip(transformedPayslip);

        // Fetch employee
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", payslipData.employee_id)
          .eq("user_id", user.id)
          .single();

        if (employeeError) throw employeeError;

        const validEmployeeStatuses = ["active", "inactive"] as const;
        type ValidEmployeeStatus = typeof validEmployeeStatuses[number];
        const transformedEmployee: Employee = {
          id: employeeData.id,
          user_id: employeeData.user_id,
          first_name: employeeData.first_name ?? "",
          last_name: employeeData.last_name ?? "",
          email: employeeData.email ?? "",
          hire_date: employeeData.hire_date ?? new Date().toISOString(),
          salary: employeeData.salary ?? 0,
          status: validEmployeeStatuses.includes(employeeData.status as any) 
              ? (employeeData.status as ValidEmployeeStatus) 
              : "inactive",
          department: employeeData.department ?? "",
          position: employeeData.position ?? "",
          created_at: employeeData.created_at,
          updated_at: employeeData.updated_at,
        };
        setEmployee(transformedEmployee);

        // Fetch payroll period
        const { data: periodData, error: periodError } = await supabase
          .from("payroll_periods")
          .select("*")
          .eq("id", payslipData.pay_run_id)
          .eq("user_id", user.id)
          .single();

        if (periodError) throw periodError;

        const validPeriodStatuses = ["draft", "processing", "completed", "cancelled"] as const;
        type ValidPeriodStatus = typeof validPeriodStatuses[number];
        const transformedPeriod: PayrollPeriod = {
          id: periodData.id,
          user_id: periodData.user_id,
          start_date: periodData.start_date,
          end_date: periodData.end_date,
          status: validPeriodStatuses.includes(periodData.status as any) 
              ? (periodData.status as ValidPeriodStatus) 
              : "draft",
          created_at: periodData.created_at,
          updated_at: periodData.updated_at,
        };
        setPeriod(transformedPeriod);

        // Fetch payslip items
        const { data: itemsData, error: itemsError } = await supabase
          .from("payslip_items")
          .select("*")
          .eq("payslip_id", params.id)
          .eq("user_id", user.id);

        if (itemsError) throw itemsError;

        const validItemTypes = ["deduction", "earning"] as const;
        type ValidItemType = typeof validItemTypes[number];
        const transformedItems: PayslipItem[] = (itemsData || []).map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          payslip_id: item.payslip_id,
          type: validItemTypes.includes(item.type as any) 
              ? (item.type as ValidItemType) 
              : "earning",
          description: item.description ?? "",
          amount: item.amount ?? 0,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        setItems(transformedItems);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading payslip");
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

  const getStatusColor = (status: Payslip["status"]) => {
    switch (status) {
      case "draft":
        return "default";
      case "approved":
        return "success";
      case "paid":
        return "success";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!payslip || !employee || !period) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">Payslip not found</h3>
          <p className="text-sm text-gray-500 mt-2">
            The payslip you're looking for doesn't exist or you don't have
            access to it.
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
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href={`/dashboard/payroll/periods/${period.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Period
              </Button>
            </Link>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Payslip</CardTitle>
                <CardDescription>
                  For period {new Date(period.start_date).toLocaleDateString()}{" "}
                  - {new Date(period.end_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={getStatusColor(payslip.status)}>
                {payslip.status.charAt(0).toUpperCase() +
                  payslip.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium">Employee Details</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Position:</span>{" "}
                      {employee.position}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Department:</span>{" "}
                      {employee.department}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Payment Details</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      {payslip.status.charAt(0).toUpperCase() +
                        payslip.status.slice(1)}
                    </p>
                    {payslip.payment_date && (
                      <p className="text-sm">
                        <span className="font-medium">Payment Date:</span>{" "}
                        {new Date(payslip.payment_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">
                  Earnings & Deductions
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Base Salary</TableCell>
                      <TableCell>
                        <Badge variant="outline">Earning</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAmount(payslip.gross_pay)}
                      </TableCell>
                    </TableRow>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type.charAt(0).toUpperCase() +
                              item.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Gross Pay</span>
                    <span>{formatAmount(payslip.gross_pay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Deductions</span>
                    <span>{formatAmount(payslip.deductions)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Pay</span>
                    <span>{formatAmount(payslip.net_pay)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
