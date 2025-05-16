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
  CardHeader,
  CardTitle,
  CardDescription,
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
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Plus,
  Clock,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
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
import { type Employee, type Timesheet, type TimesheetEntry, type TimesheetSummary } from "@/app/types/payroll";

export default function TimesheetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<TimesheetSummary>({
    total_timesheets: 0,
    total_hours: 0,
    total_overtime: 0,
    total_regular: 0,
    average_hours_per_week: 0,
  });
  const [isNewTimesheetDialogOpen, setIsNewTimesheetDialogOpen] =
    useState(false);
  const [newTimesheet, setNewTimesheet] = useState({
    employee_id: "",
    week_start: format(startOfWeek(new Date()), "yyyy-MM-dd"),
    week_end: format(endOfWeek(new Date()), "yyyy-MM-dd"),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id);

        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);

        // Fetch timesheets with entries and employee details
        const { data: timesheetsData, error: timesheetsError } = await supabase
          .from("timesheets")
          .select(`
            *,
            employee:employees(*),
            entries:timesheet_entries(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (timesheetsError) throw timesheetsError;

        // Transform the data to match the Timesheet type
        const transformedTimesheets = (timesheetsData || []).map((timesheet) => ({
          id: timesheet.id,
          user_id: timesheet.user_id,
          employee_id: timesheet.employee_id,
          week_start: timesheet.week_start,
          week_end: timesheet.week_end,
          status: timesheet.status,
          total_hours: timesheet.total_hours,
          overtime_hours: timesheet.overtime_hours,
          regular_hours: timesheet.regular_hours,
          created_at: timesheet.created_at,
          updated_at: timesheet.updated_at,
          employee: timesheet.employee,
          entries: timesheet.entries || []
        }));

        setTimesheets(transformedTimesheets);

        // Calculate summary
        const summary = {
          total_timesheets: transformedTimesheets.length,
          total_hours: transformedTimesheets.reduce(
            (acc, sheet) => acc + sheet.total_hours,
            0,
          ),
          total_overtime: transformedTimesheets.reduce(
            (acc, sheet) => acc + sheet.overtime_hours,
            0,
          ),
          total_regular: transformedTimesheets.reduce(
            (acc, sheet) => acc + sheet.regular_hours,
            0,
          ),
          average_hours_per_week: transformedTimesheets.length
            ? transformedTimesheets.reduce(
                (acc, sheet) => acc + sheet.total_hours,
                0,
              ) / transformedTimesheets.length
            : 0,
        };
        setSummary(summary);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load timesheets");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCreateTimesheet = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to create a timesheet");
        return;
      }

      const { error } = await supabase.from("timesheets").insert([
        {
          user_id: user.id,
          ...newTimesheet,
          status: "draft",
          total_hours: 0,
          overtime_hours: 0,
          regular_hours: 0,
        },
      ]);

      if (error) throw error;

      toast.success("Timesheet created successfully");
      setIsNewTimesheetDialogOpen(false);
      setNewTimesheet({
        employee_id: "",
        week_start: format(startOfWeek(new Date()), "yyyy-MM-dd"),
        week_end: format(endOfWeek(new Date()), "yyyy-MM-dd"),
      });

      // Refresh the data
      const { data: timesheetsData, error: timesheetsError } = await supabase
        .from("timesheets")
        .select(
          `
          *,
          employee:employees(*),
          entries:timesheet_entries(*)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (timesheetsError) throw timesheetsError;
      setTimesheets(timesheetsData || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create timesheet");
    }
  };

  const handleStatusChange = async (
    timesheetId: string,
    newStatus: "submitted" | "approved" | "rejected",
  ) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to update the timesheet");
        return;
      }

      const { error } = await supabase
        .from("timesheets")
        .update({ status: newStatus })
        .eq("id", timesheetId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Timesheet ${newStatus} successfully`);

      // Refresh the data
      const { data: timesheetsData, error: timesheetsError } = await supabase
        .from("timesheets")
        .select(
          `
          *,
          employee:employees(*),
          entries:timesheet_entries(*)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (timesheetsError) throw timesheetsError;
      setTimesheets(timesheetsData || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update timesheet status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      case "submitted":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading timesheets..." />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Timesheets</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage employee time records
            </p>
          </div>
          <Dialog
            open={isNewTimesheetDialogOpen}
            onOpenChange={setIsNewTimesheetDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Timesheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Timesheet</DialogTitle>
                <DialogDescription>
                  Create a new timesheet for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select
                    value={newTimesheet.employee_id}
                    onValueChange={(value) =>
                      setNewTimesheet({ ...newTimesheet, employee_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Week Start</Label>
                    <Input
                      type="date"
                      value={newTimesheet.week_start}
                      onChange={(e) =>
                        setNewTimesheet({
                          ...newTimesheet,
                          week_start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Week End</Label>
                    <Input
                      type="date"
                      value={newTimesheet.week_end}
                      onChange={(e) =>
                        setNewTimesheet({
                          ...newTimesheet,
                          week_end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNewTimesheetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTimesheet}>
                  Create Timesheet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Timesheets
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_timesheets}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_hours.toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overtime Hours
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_overtime.toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Hours/Week
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.average_hours_per_week.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timesheets</CardTitle>
            <CardDescription>View and manage all timesheets</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Regular Hours</TableHead>
                  <TableHead>Overtime Hours</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {timesheet.employee?.first_name || 'N/A'}{" "}
                          {timesheet.employee?.last_name || ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {timesheet.employee?.email || 'No email'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(timesheet.week_start), "MMM d")} -{" "}
                          {format(new Date(timesheet.week_end), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(timesheet.status)}>
                        {timesheet.status.charAt(0).toUpperCase() +
                          timesheet.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{timesheet.total_hours.toFixed(1)}</TableCell>
                    <TableCell>{timesheet.regular_hours.toFixed(1)}</TableCell>
                    <TableCell>{timesheet.overtime_hours.toFixed(1)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/payroll/timesheets/${timesheet.id}`,
                            )
                          }
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {timesheet.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(timesheet.id, "submitted")
                            }
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {timesheet.status === "submitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(timesheet.id, "approved")
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {(timesheet.status === "draft" ||
                          timesheet.status === "submitted") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(timesheet.id, "rejected")
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        )}
                        {timesheet.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              /* Implement download functionality */
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
