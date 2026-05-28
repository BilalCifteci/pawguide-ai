-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for common query patterns (tables created by Alembic)
-- These are created after migration runs

COMMENT ON DATABASE pawguide IS 'PawGuide AI – pet health and nutrition platform';
