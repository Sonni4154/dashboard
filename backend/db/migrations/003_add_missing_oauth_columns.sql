-- Migration: Add missing OAuth 2.0 columns to existing tokens table
-- Date: 2025-10-08
-- Description: Adds new OAuth 2.0 fields to existing quickbooks.tokens table

-- This migration is safe to run on existing tables
-- It uses ALTER TABLE ADD COLUMN IF NOT EXISTS

BEGIN;

-- Add new columns (all use IF NOT EXISTS to be safe)
ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS company_id VARCHAR(50);

ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS token_type VARCHAR(50) DEFAULT 'Bearer';

ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS scope TEXT;

ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;

ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS base_url VARCHAR(500);

ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE quickbooks.tokens 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update company_id from realm_id if null
UPDATE quickbooks.tokens 
SET company_id = realm_id 
WHERE company_id IS NULL AND realm_id IS NOT NULL;

-- Set base_url based on environment (production by default)
UPDATE quickbooks.tokens 
SET base_url = 'https://quickbooks.api.intuit.com'
WHERE base_url IS NULL;

-- Set default scope
UPDATE quickbooks.tokens 
SET scope = 'com.intuit.quickbooks.accounting'
WHERE scope IS NULL;

-- Mark all existing tokens as active
UPDATE quickbooks.tokens 
SET is_active = true
WHERE is_active IS NULL;

-- Set updated_at to now if null
UPDATE quickbooks.tokens 
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tokens_realm_id ON quickbooks.tokens(realm_id);
CREATE INDEX IF NOT EXISTS idx_tokens_company_id ON quickbooks.tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_tokens_is_active ON quickbooks.tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON quickbooks.tokens(expires_at);

-- Add NOT NULL constraint to company_id if not already present
-- (This will fail if there are NULL values, but we updated them above)
DO $$
BEGIN
  ALTER TABLE quickbooks.tokens ALTER COLUMN company_id SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'company_id constraint already exists or cannot be added';
END $$;

COMMIT;

-- Display table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'quickbooks' 
  AND table_name = 'tokens'
ORDER BY ordinal_position;

