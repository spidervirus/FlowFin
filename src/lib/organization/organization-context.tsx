"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"];

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setOrganization(null);
        return;
      }

      const { data: organizationMember, error: orgMemberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", session.user.id)
        .single();

      if (orgMemberError) {
        console.error("Error fetching organization member:", orgMemberError);
        setOrganization(null);
        return;
      }

      if (!organizationMember) {
        setOrganization(null);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationMember.organization_id)
        .single();

      if (orgError) {
        console.error("Error fetching organization:", orgError);
        setError(orgError);
        setOrganization(null);
        return;
      }

      setOrganization(org);
    } catch (error) {
      console.error("Error in fetchOrganization:", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to fetch organization"),
      );
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrganization();

    // Subscribe to organization changes
    const channel = supabase
      .channel("organization_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organizations",
        },
        () => {
          fetchOrganization();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchOrganization, supabase]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoading,
        error,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}
