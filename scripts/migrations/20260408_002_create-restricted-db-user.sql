-- ============================================================================
-- StorecheckAI: Restricted DB User for Application
-- ============================================================================
-- Run this script as neondb_owner (or superuser) on the Neon database.
-- After creating the user, update DATABASE_URL in .env.production:
--   DATABASE_URL=postgresql://storecheckai_app:<password>@host/neondb?sslmode=require
-- ============================================================================

-- 1. Create restricted user
CREATE ROLE storecheckai_app WITH LOGIN PASSWORD 'CHANGE_ME_TO_STRONG_PASSWORD';

-- 2. Grant connect to database
GRANT CONNECT ON DATABASE neondb TO storecheckai_app;

-- 3. Grant usage on public schema
GRANT USAGE ON SCHEMA public TO storecheckai_app;

-- 4. Grant CRUD-only permissions on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO storecheckai_app;

-- 5. Grant CRUD on future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO storecheckai_app;

-- 6. Grant sequence usage (needed for serial/auto-increment columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO storecheckai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO storecheckai_app;

-- ============================================================================
-- IMPORTANT: This user CANNOT:
--   - CREATE/DROP/ALTER tables
--   - TRUNCATE tables
--   - CREATE/DROP indexes
--   - Modify permissions
--   - Access other schemas
-- ============================================================================
