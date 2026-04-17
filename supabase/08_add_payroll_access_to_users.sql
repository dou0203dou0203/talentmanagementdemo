-- add has_payroll_access column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_payroll_access BOOLEAN DEFAULT FALSE;
