"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerForm from "@/components/customer-components/customer-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardWrapper from "../../../dashboard-wrapper";

export default function NewCustomerPage() {
  return (
    <DashboardWrapper needsSetup={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/sales/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">New Customer</h1>
            <p className="text-muted-foreground">
              Add a new customer to your business
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
} 