"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RedirectHandlerProps = {
  redirectData: {
    success?: string;
    error?: string;
    redirectTo: string;
    userData?: any;
  };
};

export function RedirectHandler({ redirectData }: RedirectHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    if (redirectData && redirectData.redirectTo) {
      // Store any success or error message in sessionStorage
      if (redirectData.success) {
        sessionStorage.setItem("success", redirectData.success);
      } else if (redirectData.error) {
        sessionStorage.setItem("error", redirectData.error);
      }

      // Store user data if available
      if (redirectData.userData) {
        sessionStorage.setItem("userData", JSON.stringify(redirectData.userData));
      }

      // Redirect to the specified path
      router.push(redirectData.redirectTo);
    }
  }, [redirectData, router]);

  return null;
} 