-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS pay_run_deductions CASCADE;
DROP TABLE IF EXISTS pay_run_employees CASCADE;
DROP TABLE IF EXISTS payslip_items CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS pay_runs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS timesheet_entries CASCADE;
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS payroll_settings CASCADE;
DROP TABLE IF EXISTS payroll_periods CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create company_settings table
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    default_currency TEXT NOT NULL DEFAULT 'USD',
    fiscal_year_start DATE NOT NULL DEFAULT '2024-01-01',
    fiscal_year_end DATE NOT NULL DEFAULT '2024-12-31',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create payroll_settings table
CREATE TABLE payroll_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    overtime_rate DECIMAL(5,2) NOT NULL DEFAULT 1.50,
    overtime_threshold INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payroll_periods table
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_date <= end_date)
);

-- Create timesheets table
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create timesheet_entries table
CREATE TABLE timesheet_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day')),
    check_in TIME,
    check_out TIME,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create leave_balances table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'other')),
    balance DECIMAL(5,2) NOT NULL DEFAULT 0,
    used DECIMAL(5,2) NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create leave_requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pay_runs table
CREATE TABLE pay_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    total_gross DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_net DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pay_run_employees table
CREATE TABLE pay_run_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    base_salary DECIMAL(15,2) NOT NULL,
    overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    overtime_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
    gross_pay DECIMAL(15,2) NOT NULL,
    deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(15,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pay_run_deductions table
CREATE TABLE pay_run_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pay_run_employee_id UUID NOT NULL REFERENCES pay_run_employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('tax', 'insurance', 'loan', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payslips table
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    base_salary DECIMAL(15,2) NOT NULL,
    overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    overtime_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
    gross_pay DECIMAL(15,2) NOT NULL,
    deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(15,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payslip_items table
CREATE TABLE payslip_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('earning', 'deduction')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better query performance
DO $$
BEGIN
    -- Employees indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_user_id') THEN
        CREATE INDEX idx_employees_user_id ON employees(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_email') THEN
        CREATE INDEX idx_employees_email ON employees(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_department') THEN
        CREATE INDEX idx_employees_department ON employees(department);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_status') THEN
        CREATE INDEX idx_employees_status ON employees(status);
    END IF;

    -- Payroll periods indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_periods_user_id') THEN
        CREATE INDEX idx_payroll_periods_user_id ON payroll_periods(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_periods_dates') THEN
        CREATE INDEX idx_payroll_periods_dates ON payroll_periods(start_date, end_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_periods_status') THEN
        CREATE INDEX idx_payroll_periods_status ON payroll_periods(status);
    END IF;

    -- Payslips indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payslips_user_id') THEN
        CREATE INDEX idx_payslips_user_id ON payslips(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payslips_employee_id') THEN
        CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payslips_period_id') THEN
        CREATE INDEX idx_payslips_period_id ON payslips(payroll_period_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payslips_status') THEN
        CREATE INDEX idx_payslips_status ON payslips(status);
    END IF;

    -- Payslip items indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payslip_items_payslip_id') THEN
        CREATE INDEX idx_payslip_items_payslip_id ON payslip_items(payslip_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payslip_items_type') THEN
        CREATE INDEX idx_payslip_items_type ON payslip_items(type);
    END IF;

    -- Attendance indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_employee_id') THEN
        CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_date') THEN
        CREATE INDEX idx_attendance_date ON attendance(date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_status') THEN
        CREATE INDEX idx_attendance_status ON attendance(status);
    END IF;

    -- Leave requests indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leave_requests_employee_id') THEN
        CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leave_requests_dates') THEN
        CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leave_requests_status') THEN
        CREATE INDEX idx_leave_requests_status ON leave_requests(status);
    END IF;

    -- Pay runs indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pay_runs_user') THEN
        CREATE INDEX idx_pay_runs_user ON pay_runs(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pay_runs_period') THEN
        CREATE INDEX idx_pay_runs_period ON pay_runs(payroll_period_id);
    END IF;
END $$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_settings_updated_at') THEN
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payroll_settings_updated_at') THEN
CREATE TRIGGER update_payroll_settings_updated_at
    BEFORE UPDATE ON payroll_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') THEN
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payroll_periods_updated_at') THEN
        CREATE TRIGGER update_payroll_periods_updated_at
            BEFORE UPDATE ON payroll_periods
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_timesheets_updated_at') THEN
CREATE TRIGGER update_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_timesheet_entries_updated_at') THEN
CREATE TRIGGER update_timesheet_entries_updated_at
    BEFORE UPDATE ON timesheet_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_updated_at') THEN
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leave_balances_updated_at') THEN
CREATE TRIGGER update_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leave_requests_updated_at') THEN
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pay_runs_updated_at') THEN
CREATE TRIGGER update_pay_runs_updated_at
    BEFORE UPDATE ON pay_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pay_run_employees_updated_at') THEN
CREATE TRIGGER update_pay_run_employees_updated_at
    BEFORE UPDATE ON pay_run_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pay_run_deductions_updated_at') THEN
CREATE TRIGGER update_pay_run_deductions_updated_at
    BEFORE UPDATE ON pay_run_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payslips_updated_at') THEN
CREATE TRIGGER update_payslips_updated_at
    BEFORE UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payslip_items_updated_at') THEN
CREATE TRIGGER update_payslip_items_updated_at
    BEFORE UPDATE ON payslip_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to calculate pay run totals
CREATE OR REPLACE FUNCTION calculate_pay_run_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_total_gross DECIMAL(15,2);
    v_total_deductions DECIMAL(15,2);
    v_total_net DECIMAL(15,2);
BEGIN
    -- Calculate totals for the pay run
    SELECT 
        COALESCE(SUM(gross_pay), 0),
        COALESCE(SUM(deductions), 0),
        COALESCE(SUM(net_pay), 0)
    INTO 
        v_total_gross,
        v_total_deductions,
        v_total_net
    FROM pay_run_employees
    WHERE pay_run_id = NEW.pay_run_id;

    -- Update the pay run totals
    UPDATE pay_runs
    SET 
        total_gross = v_total_gross,
        total_deductions = v_total_deductions,
        total_net = v_total_net,
        updated_at = NOW()
    WHERE id = NEW.pay_run_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pay run totals calculation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pay_run_totals') THEN
CREATE TRIGGER update_pay_run_totals
    AFTER INSERT OR UPDATE ON pay_run_employees
    FOR EACH ROW
    EXECUTE FUNCTION calculate_pay_run_totals();
    END IF;
END $$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, first_name, last_name, email)
    VALUES (NEW.id, '', '', NEW.email);

    INSERT INTO payroll_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 
    END IF;
END $$; 