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
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { type CompanySettings, type PayrollPeriod } from "@/app/types/payroll";

export default function PayrollPeriodsPage() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
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
          toast.error("Please sign in to view payroll periods");
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

        // Fetch payroll periods
        const { data, error } = await supabase
          .from("payroll_periods")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false });

        if (error) throw error;

        setPeriods(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading payroll periods");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusColor = (
    status: string,
  ): "default" | "secondary" | "destructive" | "success" | "outline" => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "secondary";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
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

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payroll Periods</h1>
            {settings && (
              <p className="text-sm text-muted-foreground">
                {settings.company_name}
              </p>
            )}
          </div>
          <Link href="/dashboard/payroll/periods/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Pay Period
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pay Periods</CardTitle>
            <CardDescription>
              Manage your payroll periods and process payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pay periods
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first pay period.
                </p>
                <div className="mt-6">
                  <Link href="/dashboard/payroll/periods/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Pay Period
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(period.start_date).toLocaleDateString()} -{" "}
                            {new Date(period.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(period.status)}>
                          {period.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(period.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(period.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/payroll/periods/${period.id}`}>
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
