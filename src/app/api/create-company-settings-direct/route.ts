import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log("API route called: create-company-settings-direct");
    
    // Get the current user from Supabase
    const supabase = await createClient();
    
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );
    
    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        { error: `Error getting user: ${userError.message}` },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error("No user found");
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    console.log("User found:", user.id);
    
    try {
      // Check if company settings already exist
      const { data: existingSettings, error: checkError } = await supabaseAdmin
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing settings:", checkError);
        return NextResponse.json(
          { error: `Error checking existing settings: ${checkError.message}` },
          { status: 500 }
        );
      }
      
      if (existingSettings) {
        console.log("Company settings already exist:", existingSettings);
        return NextResponse.json(
          { message: 'Company settings already exist' },
          { status: 200 }
        );
      }
      
      // Create company settings directly
      const { data, error } = await supabaseAdmin
        .from('company_settings')
        .insert([
          {
            user_id: user.id,
            company_name: 'My Company',
            country: 'United States',
            default_currency: 'USD',
            fiscal_year_start: '01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select();
      
      if (error) {
        console.error("Error creating company settings:", error);
        
        // Try an upsert operation as a fallback
        const { data: upsertData, error: upsertError } = await supabaseAdmin
          .from('company_settings')
          .upsert([
            {
              user_id: user.id,
              company_name: 'My Company',
              country: 'United States',
              default_currency: 'USD',
              fiscal_year_start: '01',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
          .select();
        
        if (upsertError) {
          console.error("Error upserting company settings:", upsertError);
          return NextResponse.json(
            { error: `Failed to create company settings: ${upsertError.message}` },
            { status: 500 }
          );
        }
        
        console.log("Company settings created with upsert:", upsertData);
        return NextResponse.json(
          { message: 'Company settings created with upsert', data: upsertData },
          { status: 201 }
        );
      }
      
      console.log("Company settings created directly:", data);
      return NextResponse.json(
        { message: 'Company settings created directly', data },
        { status: 201 }
      );
    } catch (innerError: any) {
      console.error("Error in company settings operations:", innerError);
      return NextResponse.json(
        { error: `Error in company settings operations: ${innerError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in create-company-settings-direct API route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 