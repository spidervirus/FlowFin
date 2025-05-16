-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Drop existing foreign key constraint if it exists
ALTER TABLE user_roles
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add foreign key constraint to auth.users
ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Create RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;

-- Admins can view all user roles
CREATE POLICY "Admins can view all user roles"
    ON user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'administrator'
        )
    );

-- Users can view their own role
CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Only admins can insert new user roles
CREATE POLICY "Admins can insert user roles"
    ON user_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'administrator'
        )
    );

-- Only admins can update user roles
CREATE POLICY "Admins can update user roles"
    ON user_roles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'administrator'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'administrator'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to create user role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role, status)
    VALUES (NEW.id, 'viewer', 'active');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user role on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create function to invite user
CREATE OR REPLACE FUNCTION invite_user(
    p_email TEXT,
    p_role TEXT DEFAULT 'viewer'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
    v_existing_user RECORD;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_existing_user
    FROM auth.users
    WHERE email = p_email;

    IF v_existing_user.id IS NOT NULL THEN
        -- User exists, check if they have a role
        IF EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = v_existing_user.id
        ) THEN
            -- User already has a role, return error
            RETURN json_build_object(
                'success', false,
                'error', 'User already exists and has a role'
            );
        ELSE
            -- User exists but has no role, create role
            INSERT INTO user_roles (user_id, role, status)
            VALUES (v_existing_user.id, p_role, 'invited');

            RETURN json_build_object(
                'success', true,
                'user_id', v_existing_user.id,
                'email', p_email,
                'role', p_role,
                'message', 'Role added to existing user'
            );
        END IF;
    END IF;

    -- Generate a new UUID for the user
    v_user_id := uuid_generate_v4();

    -- Create the user in auth.users
    INSERT INTO auth.users (
        id,
        email,
        role,
        email_confirmed_at,
        instance_id,
        created_at,
        updated_at,
        raw_user_meta_data
    )
    VALUES (
        v_user_id,
        p_email,
        p_role,
        NULL,
        '00000000-0000-0000-0000-000000000000',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        jsonb_build_object('role', p_role)
    );

    -- Create user role
    INSERT INTO user_roles (user_id, role, status)
    VALUES (v_user_id, p_role, 'invited');

    -- Return success response
    v_result := json_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', p_email,
        'role', p_role,
        'message', 'New user created and invited'
    );

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create function to set company creator as administrator
CREATE OR REPLACE FUNCTION set_company_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's role to administrator
    UPDATE user_roles
    SET role = 'administrator'
    WHERE user_id = NEW.created_by;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_company_creator_as_admin_trigger ON company_settings;

-- Create trigger to set company creator as administrator
CREATE TRIGGER set_company_creator_as_admin_trigger
    AFTER INSERT ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_company_creator_as_admin();

-- Grant necessary permissions
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;
GRANT EXECUTE ON FUNCTION invite_user TO authenticated;
GRANT EXECUTE ON FUNCTION invite_user TO service_role;

-- Grant access to auth.users for the service role
GRANT SELECT ON auth.users TO service_role;

-- Create view for user roles with auth.users data
CREATE OR REPLACE VIEW user_roles_with_auth AS
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.status,
    ur.last_active,
    ur.created_at,
    ur.updated_at,
    au.email,
    au.raw_user_meta_data as user_metadata
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id;

-- Grant access to the view
GRANT SELECT ON user_roles_with_auth TO authenticated;
GRANT SELECT ON user_roles_with_auth TO service_role; 