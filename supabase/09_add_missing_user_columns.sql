-- Add missing optional columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_check_date TEXT;
