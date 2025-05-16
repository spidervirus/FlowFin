-- Add auth.config function for auth system configuration

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON SCHEMA auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- Drop existing function if exists to ensure clean recreation
DROP FUNCTION IF EXISTS auth.config();

-- Create the auth.config function
CREATE OR REPLACE FUNCTION auth.config()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'site_url', current_setting('app.settings.site_url', TRUE),
    'additional_redirect_urls', current_setting('app.settings.additional_redirect_urls', TRUE),
    'jwt_expiry', current_setting('app.settings.jwt_expiry', TRUE),
    'enable_signup', current_setting('app.settings.enable_signup', TRUE)::boolean,
    'mailer_autoconfirm', current_setting('app.settings.mailer_autoconfirm', TRUE)::boolean,
    'mailer_secure_email_change_enabled', current_setting('app.settings.mailer_secure_email_change_enabled', TRUE)::boolean,
    'mailer_secure_password_change_enabled', current_setting('app.settings.mailer_secure_password_change_enabled', TRUE)::boolean
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.config() TO postgres;
GRANT EXECUTE ON FUNCTION auth.config() TO service_role;
GRANT EXECUTE ON FUNCTION auth.config() TO anon;
GRANT EXECUTE ON FUNCTION auth.config() TO authenticated;

-- Set default configuration values if not already set
DO $$
BEGIN
  -- Site URL
  IF current_setting('app.settings.site_url', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.site_url', 'http://localhost:3000', FALSE);
  END IF;

  -- Additional redirect URLs
  IF current_setting('app.settings.additional_redirect_urls', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.additional_redirect_urls', '', FALSE);
  END IF;

  -- JWT expiry
  IF current_setting('app.settings.jwt_expiry', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.jwt_expiry', '3600', FALSE);
  END IF;

  -- Enable signup
  IF current_setting('app.settings.enable_signup', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.enable_signup', 'true', FALSE);
  END IF;

  -- Mailer autoconfirm
  IF current_setting('app.settings.mailer_autoconfirm', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.mailer_autoconfirm', 'true', FALSE);
  END IF;

  -- Secure email change
  IF current_setting('app.settings.mailer_secure_email_change_enabled', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.mailer_secure_email_change_enabled', 'true', FALSE);
  END IF;

  -- Secure password change
  IF current_setting('app.settings.mailer_secure_password_change_enabled', TRUE) IS NULL THEN
    PERFORM set_config('app.settings.mailer_secure_password_change_enabled', 'true', FALSE);
  END IF;
END;
$$;