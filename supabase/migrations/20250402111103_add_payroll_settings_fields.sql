-- Add missing fields to payroll_settings table
ALTER TABLE payroll_settings
ADD COLUMN IF NOT EXISTS holiday_pay_rate numeric DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS sick_leave_accrual_rate numeric DEFAULT 0.0385,
ADD COLUMN IF NOT EXISTS vacation_leave_accrual_rate numeric DEFAULT 0.0385,
ADD COLUMN IF NOT EXISTS enable_holiday_pay boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_sick_leave boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_vacation_leave boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_401k boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS default_401k_contribution numeric DEFAULT 6,
ADD COLUMN IF NOT EXISTS enable_health_insurance boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS default_health_insurance_deduction numeric DEFAULT 200;
