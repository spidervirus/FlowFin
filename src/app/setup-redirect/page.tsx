"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetupRedirectPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkOrganizationMembership = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Error getting user:", userError);
          router.push("/sign-in");
          return;
        }

        // Check if user has an organization membership
        const { data: orgMember, error: orgError } = await supabase
          .from("organization_members")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (orgError && orgError.code !== "PGRST116") {
          console.error("Error checking organization membership:", orgError);
          router.push("/setup");
          return;
        }

        if (!orgMember) {
          console.log("No organization membership found, redirecting to setup");
          router.push("/setup");
          return;
        }

        // If we have an organization membership, redirect to dashboard
        console.log("Organization membership found, redirecting to dashboard");
        router.push("/dashboard");
      } catch (error) {
        console.error("Error in setup redirect:", error);
        router.push("/setup");
      }
    };

    checkOrganizationMembership();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">
          Please wait while we check your setup status.
        </p>
      </div>
    </div>
  );
}
