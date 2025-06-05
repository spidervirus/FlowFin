-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for organizations table
DROP POLICY IF EXISTS "Users can select organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;

-- Allow users to read organizations they belong to
CREATE POLICY "Users can select organizations"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = organizations.id
    AND organization_users.user_id = auth.uid()
  ) OR
  -- Also allow reading organizations that don't have any users yet (for initial setup)
  NOT EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = organizations.id
  )
);

-- Allow any authenticated user to create an organization
CREATE POLICY "Users can insert organizations"
ON organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update organizations they belong to
CREATE POLICY "Users can update their organizations"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = organizations.id
    AND organization_users.user_id = auth.uid()
  )
);

-- Allow users to delete organizations they belong to
CREATE POLICY "Users can delete their organizations"
ON organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = organizations.id
    AND organization_users.user_id = auth.uid()
  )
);

-- Add missing RLS policies for roles table
DROP POLICY IF EXISTS "Users can select roles" ON roles;
DROP POLICY IF EXISTS "Users can insert roles" ON roles;
DROP POLICY IF EXISTS "Users can update roles" ON roles;
DROP POLICY IF EXISTS "Users can delete roles" ON roles;

-- Allow users to read roles in their organizations
CREATE POLICY "Users can select roles"
ON roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = roles.organization_id
    AND organization_users.user_id = auth.uid()
  ) OR
  -- Also allow reading roles that don't have any users yet (for initial setup)
  NOT EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = roles.organization_id
  )
);

-- Allow any authenticated user to create roles (we'll control access through organization_users)
CREATE POLICY "Users can insert roles"
ON roles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update roles in their organizations
CREATE POLICY "Users can update roles"
ON roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = roles.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Allow users to delete roles in their organizations
CREATE POLICY "Users can delete roles"
ON roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.organization_id = roles.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Add missing RLS policies for role_permissions table
DROP POLICY IF EXISTS "Users can select role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can insert role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can update role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can delete role_permissions" ON role_permissions;

-- Allow users to read role-permission relationships in their organizations
CREATE POLICY "Users can select role_permissions"
ON role_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    JOIN organization_users ou ON r.organization_id = ou.organization_id
    WHERE r.id = role_permissions.role_id
    AND ou.user_id = auth.uid()
  ) OR
  -- Also allow reading role permissions during initial setup
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id = role_permissions.role_id
    AND NOT EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = r.organization_id
    )
  )
);

-- Allow any authenticated user to create role-permission relationships
CREATE POLICY "Users can insert role_permissions"
ON role_permissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update role-permission relationships in their organizations
CREATE POLICY "Users can update role_permissions"
ON role_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles r
    JOIN organization_users ou ON r.organization_id = ou.organization_id
    WHERE r.id = role_permissions.role_id
    AND ou.user_id = auth.uid()
  )
);

-- Allow users to delete role-permission relationships in their organizations
CREATE POLICY "Users can delete role_permissions"
ON role_permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM roles r
    JOIN organization_users ou ON r.organization_id = ou.organization_id
    WHERE r.id = role_permissions.role_id
    AND ou.user_id = auth.uid()
  )
);

-- Add missing RLS policies for organization_users table
DROP POLICY IF EXISTS "Users can select organization_users" ON organization_users;
DROP POLICY IF EXISTS "Users can insert organization_users" ON organization_users;
DROP POLICY IF EXISTS "Users can update organization_users" ON organization_users;
DROP POLICY IF EXISTS "Users can delete organization_users" ON organization_users;

-- Allow users to read organization-user relationships in their organizations
CREATE POLICY "Users can select organization_users"
ON organization_users FOR SELECT
USING (
  organization_users.user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM organization_users ou
    JOIN roles r ON ou.role_id = r.id
    WHERE ou.organization_id = organization_users.organization_id
    AND ou.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- Allow users to create organization-user relationships for organizations they own or are creating
CREATE POLICY "Users can insert organization_users"
ON organization_users FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Allow users to add themselves when creating a new organization
    organization_users.user_id = auth.uid() OR
    -- Allow organization admins to add other users
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN roles r ON ou.role_id = r.id
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
);

-- Allow users to update organization-user relationships in their organizations
CREATE POLICY "Users can update organization_users"
ON organization_users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_users ou
    JOIN roles r ON ou.role_id = r.id
    WHERE ou.organization_id = organization_users.organization_id
    AND ou.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- Allow users to delete organization-user relationships in their organizations
CREATE POLICY "Users can delete organization_users"
ON organization_users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_users ou
    JOIN roles r ON ou.role_id = r.id
    WHERE ou.organization_id = organization_users.organization_id
    AND ou.user_id = auth.uid()
    AND r.name = 'admin'
  )
); 