-- Check the most recent token entry
SELECT 
    id, 
    "realmId", 
    "companyId", 
    "isActive", 
    "expiresAt", 
    "createdAt",
    "lastUpdated",
    CASE 
        WHEN "expiresAt" > NOW() THEN 'Valid'
        ELSE 'Expired'
    END as token_status
FROM quickbooks.tokens 
ORDER BY "lastUpdated" DESC 
LIMIT 1;

-- Check if there are multiple tokens
SELECT COUNT(*) as total_tokens FROM quickbooks.tokens;

-- Update the most recent token to be active
UPDATE quickbooks.tokens 
SET "isActive" = true 
WHERE id = (SELECT id FROM quickbooks.tokens ORDER BY "lastUpdated" DESC LIMIT 1)
RETURNING id, "realmId", "isActive", "expiresAt";

