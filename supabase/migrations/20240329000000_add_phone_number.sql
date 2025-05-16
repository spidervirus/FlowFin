-- Add phone_number and company_size columns to company_settings table
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Update types in TypeScript
COMMENT ON TABLE public.company_settings IS 'Company settings and preferences';
COMMENT ON COLUMN public.company_settings.phone_number IS 'Company phone number';
COMMENT ON COLUMN public.company_settings.company_size IS 'Number of employees in the company'; 