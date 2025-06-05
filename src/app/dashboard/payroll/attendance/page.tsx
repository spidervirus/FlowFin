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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { type AttendanceRecord, type CompanySettings, type Employee } from "@/app/types/payroll";
import type { Database } from "@/types/supabase";
import { CurrencyCode } from "@/lib/utils";

type AttendanceWithEmployee = Database["public"]["Tables"]["attendance"]["Row"] & {
  employee: Database["public"]["Tables"]["employees"]["Row"];
};

export default function AttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to view attendance");
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
          setCurrency("USD");
        } else if (settingsData) {
          const currencyFromDb = settingsData.default_currency;
          const isValidCurrencyCode = (code: string | null | undefined): code is CurrencyCode => {
            // Add all valid currency codes your CurrencyCode type supports
            // This is a placeholder validation. Implement robust validation if necessary.
            return !!code && ["USD", "EUR", "GBP", "CAD", "AUD"].includes(code); // Example codes
          };

          const ensuredCurrencyCode: CurrencyCode = isValidCurrencyCode(currencyFromDb) ? currencyFromDb : "USD";

          const transformedSettings: CompanySettings = {
            // Spread known properties from settingsData that match CompanySettings fields
            id: settingsData.id,
            user_id: settingsData.user_id,
            company_name: settingsData.company_name || "",
            address: settingsData.address || "",
            phone_number: settingsData.phone_number || "",
            default_currency: ensuredCurrencyCode, // Now explicitly CurrencyCode
            company_size: (settingsData.company_size as CompanySettings['company_size'] | undefined) ?? "1-10",
            industry: (settingsData.industry as CompanySettings['industry'] | undefined) ?? "Other",
            fiscal_year_start: (settingsData.fiscal_year_start as CompanySettings['fiscal_year_start'] | undefined) ?? "01-01",
            tax_year_start: (settingsData.tax_year_start as CompanySettings['tax_year_start'] | undefined) ?? "01-01",
            created_at: settingsData.created_at,
            updated_at: settingsData.updated_at,
            organization_id: settingsData.organization_id,
            // Add any other fields from CompanySettings that are in settingsData
            // country: undefined, // Explicitly undefined if not present, or handle as per CompanySettings type
          };

          setSettings(transformedSettings);
          setCurrency(transformedSettings.default_currency as CurrencyCode);
        } else {
          setSettings(null);
          setCurrency("USD");
        }

        // Fetch active employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (employeesError) throw employeesError;

        const transformedEmployees = (employeesData || []).map(emp => ({
          ...emp,
          phone: (emp as any).phone ?? "",
          status: (emp.status === "active" || emp.status === "inactive" ? emp.status : "inactive") as "active" | "inactive",
        })) as Employee[];
        setEmployees(transformedEmployees);

        // Fetch attendance records for the selected date
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(`
            *,
            employee:employees(*)
          `)
          .eq("user_id", user.id)
          .eq("date", format(selectedDate, "yyyy-MM-dd"));

        if (attendanceError) throw attendanceError;

        // Transform the data to match AttendanceRecord type
        const transformedAttendance: AttendanceRecord[] = (attendanceData as AttendanceWithEmployee[] || []).map((record) => ({
          ...record,
          employee: record.employee
        }));

        setAttendance(transformedAttendance);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading attendance data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedDate]);

  const getStatusColor = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "success";
      case "absent":
        return "destructive";
      case "late":
        return "secondary";
      case "half_day":
        return "default";
      default:
        return "default";
    }
  };

  async function markAttendance(
    employeeId: string,
    status: AttendanceRecord["status"],
  ) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to mark attendance");
        return;
      }

      const attendanceRecord: Database["public"]["Tables"]["attendance"]["Insert"] = {
        user_id: user.id,
        employee_id: employeeId,
        date: format(selectedDate, "yyyy-MM-dd"),
        status,
        check_in: status === "present" ? new Date().toISOString() : undefined,
      };

      const { error } = await supabase
        .from("attendance")
        .upsert(attendanceRecord, {
          onConflict: "user_id,employee_id,date",
        });

      if (error) throw error;

      toast.success("Attendance marked successfully");

      // Refresh attendance data
      const { data, error: fetchError } = await supabase
        .from("attendance")
        .select(`
          *,
          employee:employees(*)
        `)
        .eq("user_id", user.id)
        .eq("date", format(selectedDate, "yyyy-MM-dd"));

      if (fetchError) throw fetchError;

      // Transform the data to match AttendanceRecord type
      const transformedAttendance: AttendanceRecord[] = (data as AttendanceWithEmployee[] || []).map((record) => ({
        ...record,
        employee: record.employee
      }));

      setAttendance(transformedAttendance);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error marking attendance");
    }
  }

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Attendance</h1>
            {settings && (
              <p className="text-sm text-muted-foreground">
                {settings.company_name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                Choose a date to view or mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Daily Attendance</CardTitle>
              <CardDescription>
                {format(selectedDate, "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No employees
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add employees to start tracking attendance
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const record = attendance.find(
                        (a) => a.employee_id === employee.id,
                      );
                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {employee.position}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            {record ? (
                              <Badge variant={getStatusColor(record.status)}>
                                {record.status.charAt(0).toUpperCase() +
                                  record.status.slice(1)}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record?.check_in
                              ? format(new Date(record.check_in), "HH:mm")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record?.check_out
                              ? format(new Date(record.check_out), "HH:mm")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Mark Attendance
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Mark Attendance</DialogTitle>
                                  <DialogDescription>
                                    Select attendance status for{" "}
                                    {employee.first_name} {employee.last_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                  <Button
                                    onClick={() =>
                                      markAttendance(employee.id, "present")
                                    }
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Present
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      markAttendance(employee.id, "absent")
                                    }
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Absent
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      markAttendance(employee.id, "late")
                                    }
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Late
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      markAttendance(employee.id, "half_day")
                                    }
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Half Day
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardWrapper>
  );
}
