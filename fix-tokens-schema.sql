-- Fix tokens table schema - add missing columns
ALTER TABLE "quickbooks"."tokens" 
ADD COLUMN IF NOT EXISTS "token_type" text DEFAULT 'Bearer',
ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "last_updated" timestamp with time zone DEFAULT now();

-- Update existing records to have default values
UPDATE "quickbooks"."tokens" 
SET 
  "token_type" = 'Bearer',
  "expires_at" = "created_at" + interval '1 hour',
  "is_active" = true,
  "last_updated" = "created_at"
WHERE "token_type" IS NULL OR "expires_at" IS NULL OR "is_active" IS NULL OR "last_updated" IS NULL;
