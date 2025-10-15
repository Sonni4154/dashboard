-- Migration: Fix mixed column naming in tokens table
-- Date: 2025-10-08
-- Description: Rename snake_case columns to camelCase to match Drizzle schema

BEGIN;

-- Rename snake_case columns to camelCase
ALTER TABLE quickbooks.tokens RENAME COLUMN refresh_token_expires_at TO "refreshTokenExpiresAt";
ALTER TABLE quickbooks.tokens RENAME COLUMN token_type TO "tokenType";
ALTER TABLE quickbooks.tokens RENAME COLUMN company_id TO "companyId";
ALTER TABLE quickbooks.tokens RENAME COLUMN is_active TO "isActive";
ALTER TABLE quickbooks.tokens RENAME COLUMN base_url TO "baseUrl";
ALTER TABLE quickbooks.tokens RENAME COLUMN updated_at TO "updatedAt";

-- Set default values for new columns
UPDATE quickbooks.tokens SET "companyId" = "realmId" WHERE "companyId" IS NULL;
UPDATE quickbooks.tokens SET "baseUrl" = 'https://quickbooks.api.intuit.com' WHERE "baseUrl" IS NULL;
UPDATE quickbooks.tokens SET "scope" = 'com.intuit.quickbooks.accounting' WHERE "scope" IS NULL;
UPDATE quickbooks.tokens SET "isActive" = true WHERE "isActive" IS NULL;
UPDATE quickbooks.tokens SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
UPDATE quickbooks.tokens SET "tokenType" = 'Bearer' WHERE "tokenType" IS NULL;

-- Make company_id NOT NULL (after setting values)
ALTER TABLE quickbooks.tokens ALTER COLUMN "companyId" SET NOT NULL;

COMMIT;

-- Show updated table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'quickbooks' 
  AND table_name = 'tokens'
ORDER BY ordinal_position;

