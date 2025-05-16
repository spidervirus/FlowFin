"use client";

import { useState, useEffect } from "react";
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
import { Plus, FileText, UserCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { type CompanySettings, type Employee } from "@/app/types/payroll";

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
          toast.error("Please sign in to view employees");
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

        // Fetch employees
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setEmployees(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading employees");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            {settings && (
              <p className="text-sm text-muted-foreground">
                {settings.company_name}
              </p>
            )}
          </div>
          <Link href="/dashboard/payroll/employees/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              Manage your employees and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No employees
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first employee.
                </p>
                <div className="mt-6">
                  <Link href="/dashboard/payroll/employees/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {employee.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {employee.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatAmount(employee.salary ?? 0)}</TableCell>
                      <TableCell>
                        {employee.hire_date 
                          ? new Date(employee.hire_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/payroll/employees/${employee.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
