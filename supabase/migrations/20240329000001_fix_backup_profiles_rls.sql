-- Drop existing policies first
DROP POLICY IF EXISTS "backup_profiles_read_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_insert_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_update_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_delete_policy" ON public.user_profiles_backup;
DROP POLICY IF EXISTS "backup_profiles_service_role_policy" ON public.user_profiles_backup;

-- Create RLS policies for backup profiles
CREATE POLICY "backup_profiles_read_policy"
    ON public.user_profiles_backup
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "backup_profiles_insert_policy"
    ON public.user_profiles_backup
    FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "backup_profiles_update_policy"
    ON public.user_profiles_backup
    FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid() OR
        auth.role() = 'service_role'
    )
    WITH CHECK (
        id = auth.uid() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "backup_profiles_delete_policy"
    ON public.user_profiles_backup
    FOR DELETE
    TO authenticated
    USING (
        id = auth.uid() OR
        auth.role() = 'service_role'
    );

-- Add service role policy for system operations
CREATE POLICY "backup_profiles_service_role_policy"
    ON public.user_profiles_backup
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles_backup TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles_backup TO authenticated; 