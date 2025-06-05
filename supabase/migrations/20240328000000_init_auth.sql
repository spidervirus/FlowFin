-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Create sequence for refresh tokens with correct ownership
CREATE SEQUENCE IF NOT EXISTS auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
    OWNED BY postgres;

-- Create auth tables
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::text,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::text,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass),
    token character varying(255),
    user_id uuid,
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT instances_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    CONSTRAINT sessions_pkey PRIMARY KEY (id)
);

-- Create auth functions
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  )::text
$$;

CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  COALESCE(
    current_setting('request.jwt.claim.email', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
  )::text
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users (instance_id, email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens (instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens (instance_id, user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens (token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_not_after_idx ON auth.sessions (not_after DESC);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role;

-- Allow public to use auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO public;
GRANT EXECUTE ON FUNCTION auth.role() TO public;
GRANT EXECUTE ON FUNCTION auth.email() TO public;

-- Set up row level security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data." ON auth.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data." ON auth.users FOR UPDATE USING (auth.uid() = id); 