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
  Calendar,
  Clock,
  Download,
  FileText,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isWeekend,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type TimeEntry, type WeeklySummary, type Employee } from "@/app/types/payroll";
import { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];
type DbTimeEntry = Tables["timesheet_entries"]["Row"];
type TimeEntryWithEmployeeDetails = DbTimeEntry & {
  employees: Tables["employees"]["Row"] | null;
};

interface NewTimeEntryForm {
  employee_id: string;
  date: string;
  hours: number;
}

export default function TimesheetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithEmployeeDetails[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({
    total_hours: 0,
    overtime_hours: 0,
    break_minutes: 0,
    days_worked: 0,
    average_hours_per_day: 0,
  });
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<NewTimeEntryForm>({
    employee_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hours: 8,
  });

  useEffect(() => {
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
          toast.error("Please sign in to view timesheet");
          router.push("/sign-in");
          return;
        }

        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (employeesError) {
          console.error("Error fetching employees:", employeesError);
          toast.error("Failed to load employees");
          return;
        }
        setEmployees(employeesData || []);

        // Fetch time entries for the selected week
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);

        const { data: entriesData, error: entriesError } = await supabase
          .from("timesheet_entries")
          .select(
            `
            *,
            employees(*)
          `,
          )
          .eq("user_id", user.id)
          .gte("date", format(weekStart, "yyyy-MM-dd"))
          .lte("date", format(weekEnd, "yyyy-MM-dd"))
          .order("date", { ascending: true });

        if (entriesError) {
          console.error("Error fetching time entries:", entriesError);
          toast.error("Failed to load time entries");
          return;
        }
        setTimeEntries(entriesData || []);

        // Calculate weekly summary
        if (entriesData && entriesData.length > 0) {
          const summary = entriesData.reduce(
            (acc, entry) => ({
              total_hours: acc.total_hours + (entry.hours || 0),
              overtime_hours: acc.overtime_hours + 0,
              break_minutes: acc.break_minutes + 0,
              days_worked: acc.days_worked + 1,
              average_hours_per_day:
                (acc.average_hours_per_day + (entry.hours || 0)) / 2,
            }),
            {
              total_hours: 0,
              overtime_hours: 0,
              break_minutes: 0,
              days_worked: 0,
              average_hours_per_day: 0,
            },
          );
          setWeeklySummary(summary);
        } else {
          setWeeklySummary({
            total_hours: 0,
            overtime_hours: 0,
            break_minutes: 0,
            days_worked: 0,
            average_hours_per_day: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load time entries");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, selectedDate]);

  const handleSubmitNewEntry = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        toast.error("Please sign in to submit time entries");
        router.push("/sign-in");
        return;
      }

      const entryData: Tables["timesheet_entries"]["Insert"] = {
        employee_id: newEntry.employee_id,
        date: newEntry.date,
        hours: newEntry.hours,
        user_id: user.id,
        timesheet_id: "DEFAULT_TIMESHEET_ID_NEEDS_REPLACEMENT",
      };

      const { data: insertedEntry, error: insertError } = await supabase
        .from("timesheet_entries")
        .insert([entryData as any])
        .select("*, employees(*)")
        .single();

      if (insertError) {
        throw insertError;
      }

      if (insertedEntry) {
        setTimeEntries((prev) => [...prev, insertedEntry as TimeEntryWithEmployeeDetails]);
      }
      setIsNewEntryDialogOpen(false);
      setNewEntry({
        employee_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        hours: 8,
      });
      toast.success("Time entry added successfully");
    } catch (error: any) {
      console.error("Error submitting time entry:", error);
      const errorMessage = error.message || "Failed to submit time entry";
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (
    entryId: string,
    newStatus: "approved" | "rejected",
  ) => {
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
        toast.error("Please sign in to update the entry");
        router.push("/sign-in");
        return;
      }

      toast.info("Status update functionality is currently disabled pending schema review.");

      // Refresh the data
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);

      const { data: entriesData, error: entriesError } = await supabase
        .from("timesheet_entries")
        .select(
          `
          *,
          employees(*)
        `,
        )
        .eq("user_id", user.id)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (entriesError) {
        console.error("Error refreshing time entries:", entriesError);
        toast.error("Failed to refresh time entries");
        return;
      }
      setTimeEntries(entriesData || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update time entry status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading timesheet..." />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Timesheet</h1>
            <p className="text-sm text-muted-foreground">
              Track employee work hours and attendance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Dialog
              open={isNewEntryDialogOpen}
              onOpenChange={setIsNewEntryDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Time Entry</DialogTitle>
                  <DialogDescription>
                    Add a new time entry for an employee
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={newEntry.employee_id}
                      onValueChange={(value) =>
                        setNewEntry({ ...newEntry, employee_id: value })
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
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={newEntry.hours}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          hours: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewEntryDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitNewEntry}>Submit Entry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklySummary.total_hours.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Worked</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklySummary.days_worked}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Timesheet</CardTitle>
            <CardDescription>
              View and manage time entries for the selected week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weekDays.map((day) => {
                    const entry = timeEntries.find((e) =>
                      isSameDay(new Date(e.date), day),
                    );
                    const isWeekendDay = isWeekend(day);

                    return (
                      <TableRow
                        key={day.toISOString()}
                        className={cn(
                          isWeekendDay && "bg-muted/50",
                          isToday(day) && "bg-primary/5",
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(day, "EEE, MMM d")}
                              {isToday(day) && (
                                <Badge variant="secondary" className="ml-2">
                                  Today
                                </Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry ? (
                            <div>
                              <div className="font-medium">
                                {entry.employees?.first_name} {entry.employees?.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {entry.employees?.email || "N/A"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              No entry
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry ? (entry.hours || 0).toFixed(1) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="md:hidden">
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              className="mb-4 flex items-center justify-between space-x-4"
            >
              <div className="flex items-center space-x-4">
                <div>
                  <div className="font-medium">
                    {entry.employees?.first_name} {entry.employees?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.employees?.email || "N/A"}
                  </div>
                </div>
              </div>
              {/* ... rest of the mobile view code ... */}
            </div>
          ))}
        </div>
      </div>
    </DashboardWrapper>
  );
}
