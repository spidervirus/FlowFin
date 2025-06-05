-- Fix auth.digest function and permissions

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- Create the auth.digest function
CREATE OR REPLACE FUNCTION auth.digest(text, text)
RETURNS text
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT encode(digest($1, $2), 'hex')
$$;

-- Create the auth.crypto_eq function if it doesn't exist
CREATE OR REPLACE FUNCTION auth.crypto_eq(text, text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN $1 = $2;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.digest(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION auth.crypto_eq(text, text) TO service_role;