import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface SetupProfileData {
  user_id: string;
  full_name: string;
  phone_number?: string;
  job_title?: string;
  department?: string;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid.trim());
}

function normalizeUUID(id: string): string {
  if (!id) {
    throw new Error('ID cannot be empty');
  }

  // If it's already a valid UUID, return it
  if (isValidUUID(id.trim())) {
    return id.trim().toLowerCase();
  }

  // Remove any non-alphanumeric characters and convert to lowercase
  const normalized = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Check if we have enough characters for a UUID
  if (normalized.length !== 32) {
    throw new Error(`Invalid ID length: ${normalized.length} (expected 32 characters)`);
  }
  
  // Format as UUID
  const uuid = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
  
  // Validate the formatted UUID
  if (!isValidUUID(uuid)) {
    throw new Error('Failed to create valid UUID from input');
  }
  
  return uuid;
}

export async function POST(request: Request) {
  try {
    // Get the user's session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get setup data from request body
    const setupData: SetupProfileData = await request.json();
    console.log('Received profile data:', setupData);

    if (!setupData.full_name) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // Initialize service role client
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      // First check if backup profile exists
      const { data: existingProfile, error: profileCheckError } = await serviceClient
        .from('user_profiles_backup')
        .select('id')
        .eq('id', setupData.user_id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking backup profile:', profileCheckError);
      }

      let profileId = existingProfile?.id;

      if (!profileId) {
        // Create backup profile if it doesn't exist
        const { data: newProfile, error: profileError } = await serviceClient
          .from('user_profiles_backup')
          .insert({
            id: setupData.user_id,
            email: session.user.email,
            name: setupData.full_name,
            full_name: setupData.full_name,
            job_title: setupData.job_title,
            phone: setupData.phone_number,
            department: setupData.department,
            token_identifier: setupData.user_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Error creating backup profile:', profileError);
          return NextResponse.json(
            { error: 'Failed to create user profile: ' + profileError.message },
            { status: 500 }
          );
        }

        if (!newProfile?.id) {
          return NextResponse.json(
            { error: 'No profile ID returned from profile creation' },
            { status: 500 }
          );
        }

        profileId = newProfile.id;
      }

      // Return the profile ID
      return NextResponse.json({ id: profileId });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { error: dbError instanceof Error ? dbError.message : 'Database operation failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 