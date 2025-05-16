"use client";

import { useEffect, useState } from "react";

export default function CreateCompanySettingsNew() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const createSettings = async () => {
      // Check if we should create settings (based on URL parameter)
      const urlParams = new URLSearchParams(window.location.search);
      const setupComplete = urlParams.get("setupComplete") === "true";

      if (!setupComplete) {
        return;
      }

      try {
        setIsCreating(true);
        console.log("Creating company settings from dashboard component");

        // Use the API route to create company settings
        const response = await fetch("/api/create-company-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Error response from API:", data);
          throw new Error(data.error || "Failed to create company settings");
        }

        console.log("Successfully created company settings:", data);
        setSuccess(true);

        // Store the company settings in localStorage
        try {
          const setupDataStr = localStorage.getItem("setupData");
          const setupData = setupDataStr ? JSON.parse(setupDataStr) : {};

          localStorage.setItem(
            "setupData",
            JSON.stringify({
              ...setupData,
              hasCompanySettings: true,
              companySettings: data.settings,
              currency: data.settings?.default_currency || "USD", // Use the currency from settings
              timestamp: new Date().toISOString(),
            }),
          );
        } catch (e) {
          console.error(
            "Error updating localStorage with company settings:",
            e,
          );
        }

        // Remove the setupComplete parameter from the URL without refreshing the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("setupComplete");
        window.history.replaceState({}, document.title, newUrl.toString());

        // Set a success message in sessionStorage
        sessionStorage.setItem(
          "success",
          "Your account setup has been completed successfully!",
        );

        // Reload the page to show the dashboard with the new settings
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        console.error("Error creating company settings:", err);
        setError(
          err.message || "An error occurred while creating company settings",
        );
      } finally {
        setIsCreating(false);
      }
    };

    createSettings();
  }, []);

  // This component doesn't render anything visible
  return null;
}
