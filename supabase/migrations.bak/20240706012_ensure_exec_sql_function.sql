-- Ensure the exec_sql function exists
-- This function is needed by our fix script to run SQL statements

-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql TO postgres; 