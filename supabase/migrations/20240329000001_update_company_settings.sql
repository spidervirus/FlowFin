-- Add missing columns to company_settings table
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Update column comments
COMMENT ON TABLE public.company_settings IS 'Company settings and preferences';
COMMENT ON COLUMN public.company_settings.address IS 'Company address';
COMMENT ON COLUMN public.company_settings.industry IS 'Company industry sector';
COMMENT ON COLUMN public.company_settings.phone_number IS 'Company phone number';
COMMENT ON COLUMN public.company_settings.company_size IS 'Number of employees in the company';

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;

CREATE POLICY "Users can view their own company settings"
    ON public.company_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings"
    ON public.company_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
    ON public.company_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 