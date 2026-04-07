-- ============================================================================
-- StorecheckAI: Add role column to users table
-- ============================================================================
-- Run this on the Neon database before deploying the new code.
-- Safe to run multiple times (IF NOT EXISTS).
-- ============================================================================

-- 1. Add role column with default 'user'
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. Set admin role for the current admin email
-- Replace 'minhhieuulaw@gmail.com' with your admin email if different
UPDATE users SET role = 'admin' WHERE email = 'minhhieuulaw@gmail.com';

-- 3. Verify
SELECT id, email, role FROM users WHERE role = 'admin';
