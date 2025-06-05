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
  Clock,
  Calendar,
  FileText,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type Employee, type Timesheet, type TimesheetEntry } from "@/app/types/payroll";
import { Database } from "@/types/supabase";

// Augmented Supabase types
type AugmentedTimesheetEntryRow = Database["public"]["Tables"]["timesheet_entries"]["Row"] & {
  overtime_hours: number;
  project: string | null;
  task: string | null;
};

type AugmentedTimesheetEntryInsert = Database["public"]["Tables"]["timesheet_entries"]["Insert"] & {
  overtime_hours?: number; // Make optional if not always present, but DB schema should guide this
  project?: string | null;
  task?: string | null;
  // Ensure all required fields from the base Insert type are here or in the usage
  // user_id and employee_id are often required by DB constraints/RLS
};

type AugmentedTimesheetRow = Database["public"]["Tables"]["timesheets"]["Row"] & {
  total_hours: number;
  overtime_hours: number;
  regular_hours: number;
};

type AugmentedTimesheetUpdate = Database["public"]["Tables"]["timesheets"]["Update"] & {
  total_hours?: number;
  overtime_hours?: number;
  regular_hours?: number;
};

// Updated TimesheetWithRelations to use augmented types
type TimesheetWithRelations = AugmentedTimesheetRow & {
  employee: Database["public"]["Tables"]["employees"]["Row"];
  entries: AugmentedTimesheetEntryRow[];
};

// Explicit type for the new timesheet entry form state
interface NewEntryFormState {
  date: string;
  hours: number | null; // Allow null for empty input
  overtime_hours: number | null; // Allow null for empty input
  description: string;
  project: string;
  task: string;
}

export default function TimesheetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timesheet, setTimesheet] = useState<TimesheetWithRelations | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<NewEntryFormState>({
    date: format(new Date(), "yyyy-MM-dd"),
    hours: null,
    overtime_hours: null,
    description: "",
    project: "",
    task: "",
  });

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        const { data, error } = await supabase
          .from("timesheets")
          .select(
            `
            *,
            employee:employees(*),
            entries:timesheet_entries(*)
          `,
          )
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        setTimesheet(data as unknown as TimesheetWithRelations);
      } catch (error) {
        console.error("Error fetching timesheet:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setFetchError(`Failed to load timesheet: ${errorMessage}`);
        toast.error("Failed to load timesheet");
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheet();
  }, [params.id, router]);

  const handleCreateEntry = async () => {
    if (!timesheet) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to create a timesheet entry");
        return;
      }

      // Validate required fields
      if (!newEntry.date) {
        toast.error("Please select a date.");
        return;
      }
      if (newEntry.hours === null || isNaN(newEntry.hours) || newEntry.overtime_hours === null || isNaN(newEntry.overtime_hours)) {
        toast.error("Please enter valid numbers for regular and overtime hours. You can enter 0 if applicable.");
        return;
      }
      if (newEntry.hours < 0 || newEntry.overtime_hours < 0) {
         toast.error("Hours cannot be negative.");
         return;
      }

      const finalHours = newEntry.hours === null || isNaN(newEntry.hours) ? 0 : newEntry.hours;
      const finalOvertimeHours = newEntry.overtime_hours === null || isNaN(newEntry.overtime_hours) ? 0 : newEntry.overtime_hours;

      const entryToInsert: AugmentedTimesheetEntryInsert = {
        timesheet_id: timesheet.id,
        // IMPORTANT: user_id and employee_id usually come from the session/context or parent timesheet.
        // Ensure these are correctly populated based on your schema requirements.
        // The linter errors suggest 'employee_id' and 'user_id' might be required on 'timesheet_entries'.
        user_id: user.id, // Assuming user.id is the correct user_id for the entry
        employee_id: timesheet.employee_id, // Assuming timesheet.employee_id is correct
        date: newEntry.date,
        hours: finalHours,
        overtime_hours: finalOvertimeHours,
        description: newEntry.description || "", // Default to empty string if not provided
        project: newEntry.project || null, // Default to null if empty
        task: newEntry.task || null,       // Default to null if empty
        // created_at and updated_at are typically handled by the database
      };

      // Attempting to remove 'as any' by ensuring entryToInsert matches Supabase's expected type.
      // This assumes created_at and updated_at are auto-generated by the database.
      const { error } = await supabase
        .from("timesheet_entries")
        .insert(entryToInsert);

      if (error) throw error;

      // Update timesheet totals - relying on types for hours being numbers
      const currentTotalHours = timesheet.total_hours;
      const currentOvertimeHours = timesheet.overtime_hours;
      // finalHours and finalOvertimeHours are already numbers from the logic above
      const entryHours = finalHours;
      const entryOvertimeHours = finalOvertimeHours;

      const total_hours = currentTotalHours + entryHours;
      const overtime_hours = currentOvertimeHours + entryOvertimeHours;
      const regular_hours = total_hours - overtime_hours;

      const updatePayload: AugmentedTimesheetUpdate = {
        total_hours,
        overtime_hours,
        regular_hours,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("timesheets")
        .update(updatePayload)
        .eq("id", timesheet.id);

      if (updateError) throw updateError;

      toast.success("Timesheet entry created successfully");
      setIsNewEntryDialogOpen(false);
      setNewEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        hours: null,
        overtime_hours: null,
        description: "",
        project: "",
        task: "",
      });

      // Refresh the data
      const { data, error: fetchError } = await supabase
        .from("timesheets")
        .select(
          `
          *,
          employee:employees(*),
          entries:timesheet_entries(*)
        `,
        )
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setTimesheet(data as unknown as TimesheetWithRelations);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create timesheet entry");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!timesheet) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to delete a timesheet entry");
        return;
      }

      const { error } = await supabase
        .from("timesheet_entries")
        .delete()
        .eq("id", entryId)
        .eq("timesheet_id", timesheet.id);

      if (error) throw error;

      // Update timesheet totals, relying on types for hours being numbers
      const remainingEntries = timesheet.entries.filter(
        (entry) => entry.id !== entryId,
      );
      const total_hours = remainingEntries.reduce(
        (acc, entry) => acc + entry.hours,
        0,
      );
      const overtime_hours = remainingEntries.reduce(
        (acc, entry) => acc + entry.overtime_hours,
        0,
      );
      const regular_hours = total_hours - overtime_hours;

      const { error: updateError } = await supabase
        .from("timesheets")
        .update({
          total_hours,
          overtime_hours,
          regular_hours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", timesheet.id);

      if (updateError) throw updateError;

      toast.success("Timesheet entry deleted successfully");

      // Refresh the data
      const { data, error: fetchError } = await supabase
        .from("timesheets")
        .select(
          `
          *,
          employee:employees(*),
          entries:timesheet_entries(*)
        `,
        )
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setTimesheet(data as unknown as TimesheetWithRelations);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete timesheet entry");
    }
  };

  const handleStatusChange = async (
    newStatus: "submitted" | "approved" | "rejected",
  ) => {
    if (!timesheet) return;

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
        .eq("id", timesheet.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Timesheet ${newStatus} successfully`);

      // Refresh the data
      const { data, error: fetchError } = await supabase
        .from("timesheets")
        .select(
          `
          *,
          employee:employees(*),
          entries:timesheet_entries(*)
        `,
        )
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setTimesheet(data as unknown as TimesheetWithRelations);
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
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading timesheet..." />
        </div>
      </DashboardWrapper>
    );
  }

  if (fetchError) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Timesheet</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        </div>
      </DashboardWrapper>
    );
  }

  if (!timesheet) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Timesheet not found</AlertDescription>
          </Alert>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Timesheet Details</h1>
            <p className="text-sm text-muted-foreground">
              View and manage timesheet entries
            </p>
          </div>
          <div className="flex space-x-2">
            {timesheet.status === "draft" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("submitted")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Submit
              </Button>
            )}
            {timesheet.status === "submitted" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("approved")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {(timesheet.status === "draft" ||
              timesheet.status === "submitted") && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("rejected")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            {timesheet.status === "approved" && (
              <Button
                variant="outline"
                onClick={() => {
                  /* Implement download functionality */
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timesheet.employee.first_name} {timesheet.employee.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {timesheet.employee.email || "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {format(new Date(timesheet.week_start), "MMM d")} -{" "}
                {format(new Date(timesheet.week_end), "MMM d, yyyy")}
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
                {timesheet.total_hours.toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(timesheet.status)}>
                {timesheet.status.charAt(0).toUpperCase() +
                  timesheet.status.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Timesheet Entries</CardTitle>
                <CardDescription>
                  View and manage daily time entries
                </CardDescription>
              </div>
              {timesheet.status === "draft" && (
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
                      <DialogTitle>New Timesheet Entry</DialogTitle>
                      <DialogDescription>
                        Add a new time entry for this timesheet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Regular Hours</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={newEntry.hours === null ? "" : newEntry.hours}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewEntry({
                                ...newEntry,
                                hours: val === "" ? null : parseFloat(val),
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Overtime Hours</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={newEntry.overtime_hours === null ? "" : newEntry.overtime_hours}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewEntry({
                                ...newEntry,
                                overtime_hours: val === "" ? null : parseFloat(val),
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Project</Label>
                        <Input
                          value={newEntry.project || ""}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              project: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Task</Label>
                        <Input
                          value={newEntry.task || ""}
                          onChange={(e) =>
                            setNewEntry({ ...newEntry, task: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newEntry.description}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              description: e.target.value,
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
                      <Button onClick={handleCreateEntry}>Create Entry</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Regular Hours</TableHead>
                  <TableHead>Overtime Hours</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Description</TableHead>
                  {timesheet.status === "draft" && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheet.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>{(typeof entry.hours === 'number' ? entry.hours : 0).toFixed(1)}</TableCell>
                    <TableCell>{(typeof entry.overtime_hours === 'number' ? entry.overtime_hours : 0).toFixed(1)}</TableCell>
                    <TableCell>{entry.project || "N/A"}</TableCell>
                    <TableCell>{entry.task || "N/A"}</TableCell>
                    <TableCell>{entry.description || "N/A"}</TableCell>
                    {timesheet.status === "draft" && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
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
