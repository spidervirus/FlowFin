"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FallbackDashboard() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const createSettings = async () => {
      try {
        setIsCreating(true);
        setError(null);

        // Get the current user from Supabase
        const supabase = createClient();

        // First check if we have a valid session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("No user session found");

        // Check if company settings already exist
        const { data: existingSettings, error: checkError } = await supabase
          .from("company_settings")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") throw checkError;
        if (existingSettings) {
          setSuccess(true);
          return;
        }

        // Create company settings
        const { error: createError } = await supabase
          .from("company_settings")
          .insert({
            user_id: session.user.id,
            company_name: "My Company",
            address: "123 Business Street",
            country: "US",
            default_currency: "USD",
            fiscal_year_start: new Date().toISOString().split("T")[0],
            industry: "Technology",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) throw createError;
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsCreating(false);
      }
    };

    createSettings();
  }, []);

  if (isCreating)
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );

  if (error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );

  if (success)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Success</CardTitle>
          <CardDescription>
            Company settings created successfully!
          </CardDescription>
        </CardHeader>
      </Card>
    );

  return null;
}
