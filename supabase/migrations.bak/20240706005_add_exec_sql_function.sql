-- Add a function to execute SQL directly
-- This is used by the fix-auth-system.js script

-- Create the function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION exec_sql TO postgres;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role; 