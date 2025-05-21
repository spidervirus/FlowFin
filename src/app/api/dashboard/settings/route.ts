import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server-client';
import { Database } from '@/types/supabase';

export async function PUT(req: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error in settings API:', userError);
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const updatedSettings = await req.json();

    // Basic validation (you might want a more robust validation library like Zod)
    if (!updatedSettings || !updatedSettings.company_name) {
        return NextResponse.json({ message: 'Invalid settings data' }, { status: 400 });
    }

    // Update company settings in the database
    const { data, error } = await supabase
      .from('company_settings')
      .update({
        company_name: updatedSettings.company_name,
        industry: updatedSettings.industry || null,
        address: updatedSettings.address || null,
        country: updatedSettings.country,
        default_currency: updatedSettings.default_currency,
        fiscal_year_start: updatedSettings.fiscal_year_start,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error updating company settings:', error);
      return NextResponse.json({ message: 'Database error updating settings' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Settings updated successfully' });

  } catch (error) {
    console.error('Unexpected error in settings API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 