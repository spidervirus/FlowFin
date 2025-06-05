-- Drop existing objects first
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Create organizations table first
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create organization_members table (before enabling RLS on organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Add trigger for updated_at on organization_members
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Now enable RLS on organizations (after organization_members exists)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view organizations they are members of"
    ON public.organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations"
    ON public.organizations
    FOR INSERT
    WITH CHECK (true);  -- Anyone can create an organization

CREATE POLICY "Organization owners can update their organizations"
    ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Organization owners can delete their organizations"
    ON public.organizations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization_members
CREATE POLICY "Users can view their own organization memberships"
    ON public.organization_members
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Organization owners can insert members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        -- Allow first member (owner) to be created
        NOT EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organization_members.organization_id
        )
        OR
        -- Or allow if user is an owner of the organization
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organization_members.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Organization owners can update members"
    ON public.organization_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organization_members.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Organization owners can delete members"
    ON public.organization_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organization_members.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Drop existing organization_id column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_settings' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.company_settings DROP COLUMN organization_id;
    END IF;
END $$;

-- Add organization_id to company_settings
ALTER TABLE public.company_settings
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD CONSTRAINT company_settings_organization_id_key UNIQUE (organization_id);

-- Enable RLS on company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_settings
CREATE POLICY "Users can view company settings for their organizations"
    ON public.company_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = company_settings.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update company settings"
    ON public.company_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = company_settings.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Organization owners can delete company settings"
    ON public.company_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = company_settings.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    ); 