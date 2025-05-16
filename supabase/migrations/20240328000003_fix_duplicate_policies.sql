BEGIN;

-- Drop all organization_members policies to ensure clean slate
DROP POLICY IF EXISTS "members_read_own_records" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_shared_records" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_first_owner" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_as_admin" ON public.organization_members;
DROP POLICY IF EXISTS "members_update_own_record" ON public.organization_members;
DROP POLICY IF EXISTS "members_update_as_admin" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete_own_record" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete_as_admin" ON public.organization_members;
DROP POLICY IF EXISTS "members_service_role_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_update_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete_policy" ON public.organization_members;

-- Drop existing helper functions
DROP FUNCTION IF EXISTS public.check_organization_admin_access(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_organization_ids(UUID);

-- Create a security definer function to check if user has any organizations
CREATE OR REPLACE FUNCTION public.has_any_organization(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members m
        WHERE m.user_id = user_id_param
        LIMIT 1
    );
$$;

-- Create a security definer function to check admin access
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members m
        WHERE m.organization_id = org_id_param
        AND m.user_id = user_id_param
        AND m.role IN ('owner', 'admin')
    );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_any_organization(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_organization(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO service_role;

-- Create simplified RLS policies
-- Read policy - users can read their own records and records of organizations they belong to
CREATE POLICY "members_read_policy"
    ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (
        -- Always allow reading own records
        user_id = auth.uid()
    );

-- First owner policy - only for users with no existing memberships
CREATE POLICY "members_insert_first_owner"
    ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        role = 'owner' AND
        NOT has_any_organization(auth.uid())
    );

-- Admin insert policy - for organization admins
CREATE POLICY "members_insert_as_admin"
    ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_organization_admin(organization_id, auth.uid())
    );

-- Update policy - users can update their own records or if they're admin
CREATE POLICY "members_update_policy"
    ON public.organization_members
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        is_organization_admin(organization_id, auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR
        is_organization_admin(organization_id, auth.uid())
    );

-- Delete policy - users can delete their own records or if they're admin
CREATE POLICY "members_delete_policy"
    ON public.organization_members
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        is_organization_admin(organization_id, auth.uid())
    );

-- Service role policy - unrestricted access
CREATE POLICY "members_service_role_policy"
    ON public.organization_members
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Drop organization_setup_progress policies
DROP POLICY IF EXISTS "setup_progress_select_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_insert_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_update_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_delete_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_service_role_policy" ON public.organization_setup_progress;

-- Drop the view if it exists
DROP VIEW IF EXISTS public.organization_setup_progress_view;

-- Ensure table structure is correct
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organization_setup_progress' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.organization_setup_progress 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure user_id is unique
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organization_setup_progress_user_id_key'
    ) THEN
        ALTER TABLE public.organization_setup_progress
        ADD CONSTRAINT organization_setup_progress_user_id_key
        UNIQUE (user_id);
    END IF;
END $$;

-- Create a function to handle setup progress retrieval with default values
CREATE OR REPLACE FUNCTION public.get_or_create_setup_progress(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    current_step INTEGER,
    step_data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
DECLARE
    v_progress_record organization_setup_progress%ROWTYPE;
BEGIN
    -- Start a subtransaction in case we need to rollback the insert
    BEGIN
        -- Try to get existing progress with explicit table reference
        SELECT *
        INTO v_progress_record
        FROM public.organization_setup_progress osp
        WHERE osp.user_id = user_id_param
        LIMIT 1;

        -- If no record exists, create one
        IF v_progress_record IS NULL THEN
            INSERT INTO public.organization_setup_progress (
                user_id,
                current_step,
                step_data,
                created_at,
                updated_at
            ) VALUES (
                user_id_param,
                1,
                '{}'::jsonb,
                NOW(),
                NOW()
            )
            RETURNING * INTO v_progress_record;
        END IF;

        -- Return the record
        RETURN QUERY
        SELECT 
            v_progress_record.id,
            v_progress_record.user_id,
            v_progress_record.current_step,
            v_progress_record.step_data,
            v_progress_record.created_at,
            v_progress_record.updated_at;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        RAISE WARNING 'Error in get_or_create_setup_progress: %', SQLERRM;
        -- Re-raise the error
        RAISE;
    END;
END;
$$;

-- Create an update function to handle updates safely
CREATE OR REPLACE FUNCTION public.update_setup_progress(
    user_id_param UUID,
    step_param INTEGER,
    step_data_param JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
BEGIN
    UPDATE public.organization_setup_progress
    SET 
        current_step = step_param,
        step_data = step_data_param,
        updated_at = NOW()
    WHERE user_id = user_id_param;

    IF NOT FOUND THEN
        INSERT INTO public.organization_setup_progress (
            user_id,
            current_step,
            step_data,
            created_at,
            updated_at
        ) VALUES (
            user_id_param,
            step_param,
            step_data_param,
            NOW(),
            NOW()
        );
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_setup_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_setup_progress(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_setup_progress(UUID, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_setup_progress(UUID, INTEGER, JSONB) TO service_role;

-- Create RLS policies for organization_setup_progress
CREATE POLICY "setup_progress_select_policy"
    ON public.organization_setup_progress
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

CREATE POLICY "setup_progress_insert_policy"
    ON public.organization_setup_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "setup_progress_update_policy"
    ON public.organization_setup_progress
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "setup_progress_delete_policy"
    ON public.organization_setup_progress
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

CREATE POLICY "setup_progress_service_role_policy"
    ON public.organization_setup_progress
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.organization_setup_progress ENABLE ROW LEVEL SECURITY;

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "organizations_select_policy"
    ON public.organizations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "organizations_insert_policy"
    ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "organizations_update_policy"
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "organizations_delete_policy"
    ON public.organizations
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Add service role policy for system operations
CREATE POLICY "organizations_service_role_policy"
    ON public.organizations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Update profiles table to include bio
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

COMMIT; 