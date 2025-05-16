import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    console.log("API route called: create-company-settings-simple");

    // Get the current user from Supabase
    const supabase = await createClient();

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        { error: `Error getting user: ${userError.message}` },
        { status: 401 },
      );
    }

    if (!user) {
      console.error("No user found");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    console.log("User found:", user.id);

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    try {
      // Simple insert operation
      const { data, error } = await supabaseAdmin
        .from("company_settings")
        .insert({
          user_id: user.id,
          company_name: "My Company",
          country: "United States",
          default_currency: "USD",
          fiscal_year_start: "01",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id");

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === "23505") {
          console.log("Company settings already exist (duplicate key)");
          return NextResponse.json(
            { message: "Company settings already exist" },
            { status: 200 },
          );
        }

        console.error("Error creating company settings:", error);
        return NextResponse.json(
          { error: `Failed to create company settings: ${error.message}` },
          { status: 500 },
        );
      }

      console.log("Company settings created successfully:", data);
      return NextResponse.json(
        { message: "Company settings created successfully", data },
        { status: 201 },
      );
    } catch (innerError: any) {
      console.error("Error in company settings operations:", innerError);
      return NextResponse.json(
        {
          error: `Error in company settings operations: ${innerError.message}`,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Error in create-company-settings-simple API route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
