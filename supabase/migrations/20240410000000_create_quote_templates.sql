-- Create enum type for template types if not exists
DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('quote', 'invoice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create quote templates table
CREATE TABLE IF NOT EXISTS public.quote_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type template_type DEFAULT 'quote',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_templates_user_id ON public.quote_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_type ON public.quote_templates(type);

-- Create partial unique index for default templates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_template_per_user 
ON public.quote_templates(user_id, type) 
WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quote templates"
    ON public.quote_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quote templates"
    ON public.quote_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quote templates"
    ON public.quote_templates FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quote templates"
    ON public.quote_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to handle template updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_quote_templates_updated_at ON public.quote_templates;
CREATE TRIGGER set_quote_templates_updated_at
    BEFORE UPDATE ON public.quote_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user default templates
CREATE OR REPLACE FUNCTION public.handle_new_user_quote_templates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.quote_templates (
        user_id,
        name,
        description,
        type,
        content,
        is_default
    ) VALUES (
        NEW.id,
        'Standard Quote',
        'Default quote template with standard terms and conditions',
        'quote',
        '{
            "terms": "1. This quote is valid for 30 days from the date of issue.\n2. Payment terms: 50% advance, 50% upon completion.\n3. Delivery timeline will be confirmed upon order confirmation.\n4. Prices are exclusive of taxes unless otherwise stated.",
            "notes": "Thank you for your business!",
            "items": [],
            "tax_rate": 5,
            "discount_rate": 0
        }'::jsonb,
        true
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new users
DROP TRIGGER IF EXISTS create_default_quote_templates ON auth.users;
CREATE TRIGGER create_default_quote_templates
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_quote_templates();

-- Create default templates for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        INSERT INTO public.quote_templates (
            user_id,
            name,
            description,
            type,
            content,
            is_default
        ) 
        SELECT
            user_record.id,
            'Standard Quote',
            'Default quote template with standard terms and conditions',
            'quote',
            '{
                "terms": "1. This quote is valid for 30 days from the date of issue.\n2. Payment terms: 50% advance, 50% upon completion.\n3. Delivery timeline will be confirmed upon order confirmation.\n4. Prices are exclusive of taxes unless otherwise stated.",
                "notes": "Thank you for your business!",
                "items": [],
                "tax_rate": 5,
                "discount_rate": 0
            }'::jsonb,
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM public.quote_templates 
            WHERE type = 'quote' 
            AND is_default = true 
            AND user_id = user_record.id
        );
    END LOOP;
END;
$$; 