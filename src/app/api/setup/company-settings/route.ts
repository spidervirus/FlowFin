import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Helper function to create a JSON response with proper headers
function jsonResponse(data: any, status: number = 200) {
  // Ensure data is always an object for consistent JSON structure
  const responseData = data && typeof data === "object" ? data : { message: data || "No data provided" };
  
  // Use NextResponse.json() for proper JSON handling
  return NextResponse.json(responseData, {
    status,
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return jsonResponse({ message: "OK" }, 200);
}

export async function POST(req: NextRequest) {
  console.log("API route called: setup/company-settings");

  try {
    // Get the authorization header
    const headersList = headers();
    const authorization = headersList.get("authorization");

    if (!authorization) {
      console.error("No authorization header provided");
      return NextResponse.json(
        { error: "Unauthorized" },
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          }
        }
      );
    }

    const {
      user_id,
      company_name,
      default_currency,
      fiscal_year_start,
    } = body;

    // Validate required fields
    if (!user_id || !company_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          }
        }
      );
    }

    // Validate fiscal_year_start
    const month = parseInt(fiscal_year_start);
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid fiscal year start month" },
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          }
        }
      );
    }

    // Format fiscal_year_start as a proper date
    const currentYear = new Date().getFullYear();
    const formattedDate = new Date(currentYear, month - 1, 1);
    const fiscalYearStartDate = formattedDate.toISOString().split("T")[0];

    // Create Supabase client
    console.log("Creating Supabase service role client...");
    console.log("Supabase URL available:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase Service Role Key available:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    console.log("Supabase service role client created.");

    try {
      // Start a transaction by using a single query
      console.log("Attempting to create organization...");
      const { data: organization, error: orgError } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: company_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orgError) throw orgError;
      console.log("Organization created successfully.", organization);

      console.log("Attempting to create company settings...", { user_id, organization_id: organization.id, company_name, default_currency, fiscal_year_start: fiscalYearStartDate, tax_year_start: fiscalYearStartDate });
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from("company_settings")
        .insert({
          user_id,
          organization_id: organization.id,
          company_name,
          default_currency,
          fiscal_year_start: fiscalYearStartDate,
          tax_year_start: fiscalYearStartDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (settingsError) throw settingsError;
      console.log("Company settings created successfully.", settings);

      console.log("Attempting to create organization member...", { user_id, organization_id: organization.id, role: 'owner' });
      const { error: memberError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          user_id,
          organization_id: organization.id,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;
      console.log("Organization member created successfully.");

      // Return successful response
      return NextResponse.json(
        { 
          success: true,
          organization,
          settings
        },
        { 
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          }
        }
      );

    } catch (dbError: any) {
      console.error("Caught database operation error in API:", dbError);
      return NextResponse.json(
        { 
          error: `Database error: ${dbError.message}`,
          code: dbError.code 
        },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          }
        }
      );
    }

  } catch (error: any) {
    console.error("Error in setup/company-settings API route:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        }
      }
    );
  }
}