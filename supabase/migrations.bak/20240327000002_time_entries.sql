-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (overtime_hours >= 0 AND overtime_hours <= 24),
    break_minutes INTEGER NOT NULL DEFAULT 30 CHECK (break_minutes >= 0 AND break_minutes <= 120),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, employee_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    -- Allow users to view their own time entries
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can view their own time entries'
    ) THEN
        CREATE POLICY "Users can view their own time entries"
        ON time_entries FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- Allow users to insert their own time entries
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can insert their own time entries'
    ) THEN
        CREATE POLICY "Users can insert their own time entries"
        ON time_entries FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Allow users to update their own time entries
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can update their own time entries'
    ) THEN
        CREATE POLICY "Users can update their own time entries"
        ON time_entries FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Allow users to delete their own time entries
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can delete their own time entries'
    ) THEN
        CREATE POLICY "Users can delete their own time entries"
        ON time_entries FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$; 