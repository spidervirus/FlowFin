BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure auth helper functions exist
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    coalesce(
        current_setting('request.jwt.claim.sub', true),
        (current_setting('request.jwt.claims', true)::jsonb->>'sub')
    )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    coalesce(
        current_setting('request.jwt.claim.role', true),
        (current_setting('request.jwt.claims', true)::jsonb->>'role')
    )::text
$$;

CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    coalesce(
        current_setting('request.jwt.claim.email', true),
        (current_setting('request.jwt.claims', true)::jsonb->>'email')
    )::text
$$;

-- Ensure auth.users table exists
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text,
    encrypted_password text,
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token text,
    confirmation_sent_at timestamp with time zone,
    recovery_token text,
    recovery_sent_at timestamp with time zone,
    email_change_token_new text,
    email_change text,
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text NULL,
    phone_confirmed_at timestamp with time zone,
    phone_change text NULL,
    phone_change_token text NULL,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current text,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token text,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone,
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_phone_key UNIQUE (phone),
    CONSTRAINT chk_users_email_length CHECK ((char_length(email) <= 255)),
    CONSTRAINT chk_users_phone_length CHECK ((char_length(phone) <= 255)),
    CONSTRAINT users_email_change_key UNIQUE (email_change)
);

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners and admins can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "System can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Enable read for users who can access the organization" ON public.organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Enable update for organization owners and admins" ON public.organizations;
DROP POLICY IF EXISTS "organizations_read_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;

DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can add members" ON public.organization_members;
DROP POLICY IF EXISTS "First owner can be created" ON public.organization_members;
DROP POLICY IF EXISTS "System can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can delete members" ON public.organization_members;
DROP POLICY IF EXISTS "Enable read for users who can access the organization" ON public.organization_members;
DROP POLICY IF EXISTS "Enable read access to own records" ON public.organization_members;
DROP POLICY IF EXISTS "Enable read access to organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Enable insert for first owner" ON public.organization_members;
DROP POLICY IF EXISTS "Enable insert for organization owners and admins" ON public.organization_members;
DROP POLICY IF EXISTS "Enable update for organization owners and admins" ON public.organization_members;
DROP POLICY IF EXISTS "Enable delete for organization owners and admins" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_own_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_organization_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_first_owner_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_update_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_bypass_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_select_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_by_admin_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_service_role_policy" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_own_records" ON public.organization_members;
DROP POLICY IF EXISTS "members_read_shared_records" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_first_owner" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert_as_admin" ON public.organization_members;
DROP POLICY IF EXISTS "members_update_own_record" ON public.organization_members;
DROP POLICY IF EXISTS "members_update_as_admin" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete_own_record" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete_as_admin" ON public.organization_members;
DROP POLICY IF EXISTS "members_service_role_policy" ON public.organization_members;

DROP POLICY IF EXISTS "setup_progress_select_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_insert_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_update_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_delete_policy" ON public.organization_setup_progress;
DROP POLICY IF EXISTS "setup_progress_service_role_policy" ON public.organization_setup_progress;

-- Drop existing profile policies first
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Drop existing backup profile policies
DROP POLICY IF EXISTS "backup_profiles_read_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_insert_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_update_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_delete_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "Service role can manage backup profiles" ON public.user_profiles_backup;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.organization_users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles_backup CASCADE;
DROP TABLE IF EXISTS public.organization_setup_progress CASCADE;

-- Drop triggers first (before dropping functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS organization_members_updated ON public.organization_members;

-- Drop functions after triggers
DROP FUNCTION IF EXISTS public.create_default_organization() CASCADE;
DROP FUNCTION IF EXISTS public.handle_organization_member_changes() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_organization_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_member_of_organization(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organizations() CASCADE;

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create organization_setup_progress table
CREATE TABLE IF NOT EXISTS public.organization_setup_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 1,
    step_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create the main profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    job_title TEXT,
    phone TEXT,
    department TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create backup profiles table
CREATE TABLE public.user_profiles_backup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    token_identifier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_setup_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles_backup ENABLE ROW LEVEL SECURITY;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.has_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members base_members
        WHERE base_members.organization_id = org_id
        AND base_members.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members base_members
        WHERE base_members.organization_id = org_id
        AND base_members.user_id = auth.uid()
        AND base_members.role IN ('owner', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_organization(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid();
$$;

-- Create trigger functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _name TEXT;
    _full_name TEXT;
    _role TEXT;
    _profile_id UUID;
BEGIN
    -- Get name, full_name and role from metadata with better defaults
    _name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    _full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    _profile_id := gen_random_uuid();

    -- Create profile with better error handling
    BEGIN
        INSERT INTO public.profiles (
            id,
            user_id,
            email,
            name,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            _profile_id,
            NEW.id,
            NEW.email,
            _name,
            _full_name,
            _role,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile, attempting backup: %', SQLERRM;
        
        BEGIN
            INSERT INTO public.user_profiles_backup (
                id,
                user_id,
                email,
                name,
                full_name,
                role,
                created_at,
                updated_at
            ) VALUES (
                _profile_id,
                NEW.id,
                NEW.email,
                _name,
                _full_name,
                _role,
                NOW(),
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error creating backup profile: %', SQLERRM;
        END;
    END;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_organization()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Create default organization with better error handling
    BEGIN
        INSERT INTO public.organizations (name)
        VALUES ('My Organization')
        RETURNING id INTO org_id;

        -- Add user as owner of the organization
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (org_id, NEW.id, 'owner');
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating organization or adding member: %', SQLERRM;
    END;

    -- Create initial setup progress with separate error handling
    BEGIN
        INSERT INTO public.organization_setup_progress (user_id, current_step, step_data)
        VALUES (NEW.id, 1, '{}'::jsonb)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            current_step = 1,
            step_data = '{}'::jsonb,
            updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating/updating setup progress: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_organization_member_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update updated_at timestamp
    NEW.updated_at = NOW();
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error updating timestamp: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_org
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_organization();

CREATE TRIGGER organization_members_updated
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_organization_member_changes();

-- Create RLS policies for organizations
CREATE POLICY "organizations_read_policy"
    ON public.organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "organizations_insert_policy"
    ON public.organizations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "organizations_update_policy"
    ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Create RLS policies for organization_members
CREATE POLICY "members_read_own_records"
    ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "members_read_shared_records"
    ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT DISTINCT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "members_insert_first_owner"
    ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND role = 'owner'
        AND NOT EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "members_insert_as_admin"
    ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "members_update_own_record"
    ON public.organization_members
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_update_as_admin"
    ON public.organization_members
    FOR UPDATE
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "members_delete_own_record"
    ON public.organization_members
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "members_delete_as_admin"
    ON public.organization_members
    FOR DELETE
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "members_service_role_policy"
    ON public.organization_members
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for organization_setup_progress
CREATE POLICY "setup_progress_select_policy"
    ON public.organization_setup_progress
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "setup_progress_insert_policy"
    ON public.organization_setup_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "setup_progress_update_policy"
    ON public.organization_setup_progress
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "setup_progress_delete_policy"
    ON public.organization_setup_progress
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

-- Add service role policy for organization_setup_progress
CREATE POLICY "setup_progress_service_role_policy"
    ON public.organization_setup_progress
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for profiles
CREATE POLICY "profiles_read_policy"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.jwt()->>'sub' = user_id::text
    );

CREATE POLICY "profiles_insert_policy"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "profiles_update_policy"
    ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "profiles_delete_policy"
    ON public.profiles
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

-- Create RLS policies for backup profiles
CREATE POLICY "backup_profiles_read_policy"
    ON public.user_profiles_backup
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.jwt()->>'sub' = user_id::text OR
        auth.role() = 'service_role'
    );

CREATE POLICY "backup_profiles_insert_policy"
    ON public.user_profiles_backup
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "backup_profiles_update_policy"
    ON public.user_profiles_backup
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "backup_profiles_delete_policy"
    ON public.user_profiles_backup
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

-- Grant necessary permissions
GRANT ALL ON public.organization_setup_progress TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_profiles_backup TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_setup_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles_backup TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_composite ON public.organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_role ON public.organization_members(user_id, role);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_role ON public.organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_organization_setup_progress_user_id ON public.organization_setup_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_profiles_user_id ON public.user_profiles_backup(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_profiles_email ON public.user_profiles_backup(email);

-- Add function to check organization setup status
CREATE OR REPLACE FUNCTION public.get_organization_setup_status(user_id_param UUID)
RETURNS TABLE (
    current_step INTEGER,
    step_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT osp.current_step, osp.step_data
    FROM organization_setup_progress osp
    WHERE osp.user_id = user_id_param
    LIMIT 1;

    -- If no row found, return default values
    IF NOT FOUND THEN
        RETURN QUERY SELECT 1::INTEGER, '{}'::jsonb;
    END IF;
END;
$$;

-- Grant additional permissions
GRANT EXECUTE ON FUNCTION public.get_organization_setup_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_setup_status(UUID) TO service_role;

-- Add unique constraint if not exists
DO $$ 
BEGIN
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

COMMIT; 