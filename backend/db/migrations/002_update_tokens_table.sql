-- Migration: Update QuickBooks tokens table for OAuth 2.0
-- Date: 2025-10-08
-- Description: Add missing OAuth 2.0 fields and update schema to match unified implementation

-- Drop old table if needed (WARNING: This will lose existing data)
-- If you have existing data, you may want to migrate it first
-- Uncomment the following line ONLY if you want to start fresh:
-- DROP TABLE IF EXISTS quickbooks.tokens CASCADE;

-- Create updated tokens table with all OAuth 2.0 fields
CREATE TABLE IF NOT EXISTS quickbooks.tokens (
  id BIGINT PRIMARY KEY NOT NULL,
  company_id VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  realm_id VARCHAR(50),
  base_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_realm_id ON quickbooks.tokens(realm_id);
CREATE INDEX IF NOT EXISTS idx_tokens_company_id ON quickbooks.tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_tokens_is_active ON quickbooks.tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON quickbooks.tokens(expires_at);

-- Add comment to document the table
COMMENT ON TABLE quickbooks.tokens IS 'OAuth 2.0 tokens for QuickBooks Online API integration';

-- Add column comments
COMMENT ON COLUMN quickbooks.tokens.id IS 'Unique identifier (BigInt timestamp)';
COMMENT ON COLUMN quickbooks.tokens.company_id IS 'QuickBooks company/realm ID';
COMMENT ON COLUMN quickbooks.tokens.access_token IS 'OAuth 2.0 access token (valid ~1 hour)';
COMMENT ON COLUMN quickbooks.tokens.refresh_token IS 'OAuth 2.0 refresh token (valid ~100 days)';
COMMENT ON COLUMN quickbooks.tokens.token_type IS 'Token type (typically Bearer)';
COMMENT ON COLUMN quickbooks.tokens.scope IS 'OAuth scopes granted';
COMMENT ON COLUMN quickbooks.tokens.expires_at IS 'Access token expiration timestamp';
COMMENT ON COLUMN quickbooks.tokens.refresh_token_expires_at IS 'Refresh token expiration timestamp';
COMMENT ON COLUMN quickbooks.tokens.realm_id IS 'QuickBooks realm ID (company identifier)';
COMMENT ON COLUMN quickbooks.tokens.base_url IS 'API base URL (sandbox or production)';
COMMENT ON COLUMN quickbooks.tokens.is_active IS 'Whether this token is currently active';
COMMENT ON COLUMN quickbooks.tokens.created_at IS 'Token creation timestamp';
COMMENT ON COLUMN quickbooks.tokens.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN quickbooks.tokens.last_updated IS 'Last refresh timestamp';

