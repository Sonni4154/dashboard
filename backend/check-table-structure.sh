#!/bin/bash

# Check the current structure of the quickbooks.tokens table

echo "Checking quickbooks.tokens table structure..."
echo ""

psql "postgresql://neondb_owner:npg_rvq3KUmM4SBb@ep-morning-truth-a-2.us-west-2.aws.neon.tech/neondb?sslmode=require" << 'EOF'
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'quickbooks' 
  AND table_name = 'tokens'
) as table_exists;

-- Show all columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'quickbooks' 
  AND table_name = 'tokens'
ORDER BY ordinal_position;

-- Show sample data (if any)
SELECT COUNT(*) as row_count FROM quickbooks.tokens;
EOF

