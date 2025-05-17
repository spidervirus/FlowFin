"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProcessPendingSetup() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const processPendingSetup = async () => {
      // Check if we should process setup data (based on URL parameter)
      const urlParams = new URLSearchParams(window.location.search);
      const shouldProcess = urlParams.get("setupComplete") === "true";

      // If we have the setupComplete parameter but no setup data in localStorage,
      // create a minimal setup data object to allow the dashboard to load
      if (shouldProcess) {
        console.log(
          "setupComplete parameter found, ensuring localStorage is set",
        );

        // Store setup data in localStorage
        localStorage.setItem(
          "setupData",
          JSON.stringify({
            setupComplete: true,
            hasCompanySettings: true,
            currency: "USD", // Default currency
            timestamp: new Date().toISOString(),
          }),
        );

        // Remove the setupComplete parameter from the URL without refreshing the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("setupComplete");
        window.history.replaceState({}, document.title, newUrl.toString());

        // Set a success message in sessionStorage for the SuccessMessage component to display
        sessionStorage.setItem(
          "success",
          "Your account setup has been completed successfully!",
        );

        // No need to process further
        return;
      }

      // Check if there's setup data in localStorage
      const setupDataStr = localStorage.getItem("setupData");
      if (!setupDataStr) return;

      try {
        setIsProcessing(true);
        const setupData = JSON.parse(setupDataStr);

        console.log("Processing setup data:", setupData);

        // Check if we have a user ID in the setup data
        let userId = setupData.userId;
        let authError = false;

        // If we don't have a user ID in the setup data, try to get it from Supabase
        if (!userId) {
          try {
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error) {
              console.error("Authentication error:", error);
              authError = true;
            } else if (user) {
              userId = user.id;
            }
          } catch (authError) {
            console.error("Authentication error:", authError);
            // Continue with processing even if authentication fails
          }
        }

        // If we still don't have a user ID, try to get it from localStorage
        if (!userId) {
          console.log("No valid session found, will try to use stored user ID");
          try {
            // First check sessionStorage (most reliable)
            const sessionUserId = sessionStorage.getItem("currentUserId");
            if (sessionUserId) {
              userId = sessionUserId;
              console.log(
                "Got user ID from sessionStorage currentUserId:",
                userId,
              );
            }

            // Then check localStorage currentUserId (our custom storage)
            if (!userId) {
              const localUserId = localStorage.getItem("currentUserId");
              if (localUserId) {
                userId = localUserId;
                console.log(
                  "Got user ID from localStorage currentUserId:",
                  userId,
                );
              }
            }

            // Try to get user data from localStorage (might have been stored during sign-up)
            if (!userId) {
              const userDataStr = localStorage.getItem("userData");
              if (userDataStr) {
                try {
                  const userData = JSON.parse(userDataStr);
                  if (userData?.user?.id) {
                    userId = userData.user.id;
                    console.log(
                      "Got user ID from localStorage userData:",
                      userId,
                    );
                  }
                } catch (parseError) {
                  console.error(
                    "Error parsing userData from localStorage:",
                    parseError,
                  );
                }
              }
            }

            // Check Supabase auth token in localStorage
            if (!userId) {
              const supabaseAuthStr = localStorage.getItem(
                "supabase.auth.token",
              );
              if (supabaseAuthStr) {
                try {
                  const supabaseAuth = JSON.parse(supabaseAuthStr);
                  if (supabaseAuth?.currentSession?.user?.id) {
                    userId = supabaseAuth.currentSession.user.id;
                    console.log(
                      "Got user ID from localStorage supabase.auth.token:",
                      userId,
                    );
                  }
                } catch (parseError) {
                  console.error(
                    "Error parsing supabase.auth.token from localStorage:",
                    parseError,
                  );
                }
              }
            }

            // Check session storage for Supabase auth token
            if (!userId) {
              const sessionUserStr = sessionStorage.getItem(
                "supabase.auth.token",
              );
              if (sessionUserStr) {
                try {
                  const sessionData = JSON.parse(sessionUserStr);
                  if (sessionData?.currentSession?.user?.id) {
                    userId = sessionData.currentSession.user.id;
                    console.log(
                      "Got user ID from sessionStorage supabase.auth.token:",
                      userId,
                    );
                  }
                } catch (e) {
                  console.error("Error parsing session storage data:", e);
                }
              }
            }

            // Last resort - check URL for user ID parameter
            if (!userId) {
              const urlParams = new URLSearchParams(window.location.search);
              const urlUserId = urlParams.get("userId");
              if (urlUserId) {
                userId = urlUserId;
                console.log("Got user ID from URL parameter:", userId);
              }
            }

            // If we found a user ID, store it in all possible locations for future use
            if (userId) {
              localStorage.setItem("currentUserId", userId);
              sessionStorage.setItem("currentUserId", userId);

              // Also store in userData format for compatibility
              const userDataObj = {
                user: {
                  id: userId,
                },
              };
              localStorage.setItem("userData", JSON.stringify(userDataObj));
            }
          } catch (localStorageError) {
            console.error(
              "Error getting user data from localStorage:",
              localStorageError,
            );
          }
        }

        // If we still don't have a user ID, we can't proceed with saving the data
        if (!userId) {
          console.error("Could not determine user ID, cannot save setup data");

          // Store the setup data with a flag to process it after sign-in
          localStorage.setItem("pendingSetupData", setupDataStr);
          localStorage.setItem("setupPending", "true");
          localStorage.setItem(
            "setupError",
            "Could not determine user ID. Please sign in again.",
          );

          // If we have an auth error, redirect to sign-in
          if (authError) {
            // Redirect to sign-in
            router.push(
              "/sign-in?error=Your session has expired. Please sign in again to complete setup.",
            );
            return;
          }

          // Even without an auth error, we should redirect to sign-in if we can't determine the user ID
          router.push(
            "/sign-in?error=Please sign in again to complete your account setup.",
          );
          return;
        }

        // Now we have a user ID, we can proceed with saving the data
        // Remove the createClient() call since we're using the singleton

        // If we have a user ID but no company settings, create them
        try {
          // Check if company settings already exist
          const { data: existingSettings, error: settingsError } =
            await supabase.from("company_settings")
              .select("id")
              .eq("user_id", userId)
              .single();

          if (settingsError && settingsError.code !== "PGRST116") {
            console.error(
              "Error checking for existing company settings:",
              settingsError,
            );
          }

          // If company settings already exist, skip creation
          if (existingSettings?.id) {
            console.log("Company settings already exist, skipping creation");
          } else {
            // Create company settings
            console.log("Creating company settings for user:", userId);

            // Get company data from setup data
            const companyName = setupData.companyName || "My Company";
            const address = setupData.address || "";
            const country = setupData.country || "US";
            const industry = setupData.industry || "other";
            const fiscalYearStart = setupData.fiscalYearStart || "01";
            const currency = setupData.currency || "USD";

            try {
              const { data: companyData, error: companyError } =
                await supabase.from("company_settings")
                  .insert({
                    user_id: userId,
                    company_name: companyName,
                    address: address,
                    country: country,
                    industry: industry,
                    fiscal_year_start: fiscalYearStart,
                    default_currency: currency,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .select()
                  .single();

              if (companyError) {
                console.error("Error creating company settings:", companyError);
              } else {
                console.log("Successfully created company settings");

                // Update the setupData in localStorage with the currency
                localStorage.setItem(
                  "setupData",
                  JSON.stringify({
                    ...setupData,
                    currency: currency,
                    hasCompanySettings: true,
                    timestamp: new Date().toISOString(),
                  }),
                );
              }
            } catch (companyError) {
              console.error(
                "Exception creating company settings:",
                companyError,
              );
            }
          }
        } catch (settingsError) {
          console.error("Exception checking company settings:", settingsError);
        }

        // Process user preferences
        if (setupData.preferences) {
          try {
            const { error: preferencesError } = await supabase.from("user_preferences")
              .upsert({
                user_id: userId,
                currency: setupData.preferences.currency,
                account_type: setupData.preferences.accountType,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (preferencesError) {
              console.error("Error saving preferences:", preferencesError);
            } else {
              console.log("Successfully saved user preferences");
            }
          } catch (preferencesError) {
            console.error("Exception saving preferences:", preferencesError);
          }
        }

        // Process account
        if (setupData.account) {
          try {
            const { error: accountError } = await supabase.from("accounts")
              .insert({
                user_id: userId,
                name: setupData.account.name,
                type: setupData.account.type,
                balance: setupData.account.balance,
                currency: setupData.account.currency,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (accountError) {
              console.error("Error creating account:", accountError);
            } else {
              console.log("Successfully created account");
            }
          } catch (accountError) {
            console.error("Exception creating account:", accountError);
          }
        }

        // Process budget
        if (setupData.budget) {
          try {
            const today = new Date();
            const startDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              1,
            );
            const endDate = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              0,
            );

            const { error: budgetError } = await supabase.from("budgets" as any)
              .insert({
                user_id: userId,
                name: setupData.budget.name,
                description: setupData.budget.description,
                start_date: startDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
                is_recurring: true,
                recurrence_period: "monthly",
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (budgetError) {
              console.error("Error creating budget:", budgetError);
            } else {
              console.log("Successfully created budget");
            }
          } catch (budgetError) {
            console.error("Exception creating budget:", budgetError);
          }
        }

        // Process financial goal
        if (setupData.goal) {
          try {
            const goalDate = new Date();
            goalDate.setMonth(goalDate.getMonth() + 6); // 6 months from now

            // First check if the Savings Goals category exists
            const { data: existingCategory, error: existingCategoryError } = await supabase
              .from("categories")
              .select("id")
              .eq("name", "Savings Goals")
              .eq("user_id", userId)
              .single();

            let categoryId: string;

            if (existingCategoryError) {
              // Category doesn't exist, create it
              const { data: categoryData, error: categoryError } = await supabase
                .from("categories")
                .insert({
                  name: "Savings Goals",
                  type: "expense",
                  color: "#2196F3",
                  user_id: userId,
                  is_active: true,
                  is_default: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (categoryError) {
                console.error("Error creating category:", categoryError);
                return;
              }
              categoryId = categoryData.id;
            } else {
              categoryId = existingCategory.id;
            }

            const { error: goalError } = await supabase.from("financial_goals")
              .insert({
                user_id: userId,
                name: setupData.goal.name,
                target_amount: setupData.goal.targetAmount,
                current_amount: 0,
                start_date: new Date().toISOString().split("T")[0],
                target_date: goalDate.toISOString().split("T")[0],
                category_id: categoryId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (goalError) {
              console.error("Error creating goal:", goalError);
            } else {
              console.log("Successfully created financial goal");
            }
          } catch (goalError) {
            console.error("Exception creating goal:", goalError);
          }
        }

        // Clear the setup data
        localStorage.removeItem("setupData");

        // Also clear the user data if it was stored in localStorage
        localStorage.removeItem("userData");

        console.log("Setup processing completed successfully");

        // Remove the setupComplete parameter from the URL without refreshing the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("setupComplete");
        window.history.replaceState({}, document.title, newUrl.toString());

        // Set a success message in sessionStorage for the SuccessMessage component to display
        sessionStorage.setItem(
          "success",
          "Your account setup has been completed successfully!",
        );

        // Don't reload the page, as it will interrupt the redirect
        // window.location.reload();
      } catch (err: any) {
        console.error("Error processing setup data:", err);
        setError(
          err.message || "An error occurred while processing your setup data",
        );
      } finally {
        setIsProcessing(false);
      }
    };

    // Process setup data when the component mounts
    processPendingSetup();
  }, [router]);

  // This component doesn't render anything visible
  return null;
}
