"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import DashboardWrapper from "../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type Database } from "@/types/supabase";
import { type LeaveRequest, type LeaveType, type LeaveBalance, type Employee } from "@/app/types/payroll";

type Tables = Database["public"]["Tables"];
type DbLeaveRequest = Tables["leave_requests"]["Row"];
type DbLeaveBalance = Tables["leave_balances"]["Row"];

export default function LeaveRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState<Omit<DbLeaveRequest, "id">>({
    user_id: "",
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    status: "pending",
    reason: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

        // Fetch leave requests with employee details
        const { data: requestsData, error: requestsError } = await supabase
          .from("leave_requests")
          .select(
            `
            *,
            employee:employees(*)
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (requestsError) throw requestsError;
        
        // Transform the data to match our LeaveRequest type
        const transformedRequests = (requestsData || []).map((request: DbLeaveRequest & { employee: Employee | null }) => ({
          ...request,
          employee: request.employee || undefined
        }));
        
        setLeaveRequests(transformedRequests);

        // Fetch leave balances for each employee
        const balances: Record<string, LeaveBalance> = {};
        for (const employee of employeesData || []) {
          const { data: allBalanceRowsForEmployee, error: balanceFetchError } = await supabase
            .from("leave_balances")
            .select("leave_type, remaining_days")
            .eq("employee_id", employee.id);

          const currentEmployeeBalances: LeaveBalance = { annual: 0, sick: 0, unpaid: 0 };
          if (balanceFetchError) {
            console.error(`Error fetching balances for ${employee.id}:`, balanceFetchError);
          } else if (allBalanceRowsForEmployee) {
            allBalanceRowsForEmployee.forEach((row: any) => {
              if (row.leave_type === 'annual') {
                currentEmployeeBalances.annual = row.remaining_days || 0;
              } else if (row.leave_type === 'sick') {
                currentEmployeeBalances.sick = row.remaining_days || 0;
              } else if (row.leave_type === 'unpaid') {
                currentEmployeeBalances.unpaid = row.remaining_days || 0;
              }
            });
          }
          balances[employee.id] = currentEmployeeBalances;
        }
        setLeaveBalances(balances);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load leave requests");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubmitNewRequest = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to submit a request");
        return;
      }

      const requestData = {
        ...newRequest,
        user_id: user.id,
      };

      const { data: insertedData, error } = await supabase
        .from("leave_requests")
        .insert([requestData])
        .select(`*, employee:employees(*)`)
        .single();

      if (error) throw error;

      toast.success("Leave request submitted successfully");
      setIsNewRequestDialogOpen(false);
      setNewRequest({
        user_id: "",
        employee_id: "",
        leave_type: "annual",
        start_date: "",
        end_date: "",
        status: "pending",
        reason: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (insertedData) {
        // Add the new request to the state
        setLeaveRequests(prev => [{
          ...insertedData,
          employee: insertedData.employee || undefined
        }, ...prev]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit leave request");
    }
  };

  const handleStatusChange = async (
    requestId: string,
    newStatus: "approved" | "rejected",
  ) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to update the request");
        return;
      }

      const { data: updatedData, error } = await supabase
        .from("leave_requests")
        .update({ status: newStatus })
        .eq("id", requestId)
        .eq("user_id", user.id)
        .select(`*, employee:employees(*)`)
        .single();

      if (error) throw error;

      toast.success(`Leave request ${newStatus} successfully`);

      if (updatedData) {
        // Update the request in the state
        setLeaveRequests(prev => prev.map(request => 
          request.id === requestId 
            ? { ...updatedData, employee: updatedData.employee || undefined }
            : request
        ));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update leave request status");
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

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "annual":
        return "success";
      case "sick":
        return "destructive";
      case "unpaid":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading leave requests..." />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leave Requests</h1>
            <p className="text-sm text-muted-foreground">
              Manage employee leave requests and approvals
            </p>
          </div>
          <Dialog
            open={isNewRequestDialogOpen}
            onOpenChange={setIsNewRequestDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Leave Request</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select
                    value={newRequest.employee_id}
                    onValueChange={(value) =>
                      setNewRequest({ ...newRequest, employee_id: value })
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
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newRequest.start_date}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newRequest.end_date}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select
                    value={newRequest.leave_type}
                    onValueChange={(value: string) =>
                      setNewRequest({ ...newRequest, leave_type: value as LeaveType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={newRequest.reason}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, reason: e.target.value })
                    }
                    placeholder="Enter reason for leave"
                  />
                </div>
                {newRequest.employee_id &&
                  leaveBalances[newRequest.employee_id] && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Leave Balance</AlertTitle>
                      <AlertDescription>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-sm font-medium">Annual</p>
                            <p className="text-sm">
                              {leaveBalances[newRequest.employee_id].annual}{" "}
                              days
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Sick</p>
                            <p className="text-sm">
                              {leaveBalances[newRequest.employee_id].sick} days
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Unpaid</p>
                            <p className="text-sm">
                              {leaveBalances[newRequest.employee_id].unpaid}{" "}
                              days
                            </p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNewRequestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitNewRequest}>Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {request.employee?.first_name}{" "}
                          {request.employee?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.employee?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLeaveTypeColor(request.leave_type)}>
                        {request.leave_type.charAt(0).toUpperCase() +
                          request.leave_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(request.start_date), "MMM d, yyyy")}{" "}
                          - {format(new Date(request.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(request.id!, "approved")
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(request.id!, "rejected")
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
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
