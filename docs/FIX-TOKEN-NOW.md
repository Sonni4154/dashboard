# 🔧 Fix QuickBooks Token Issue

**Problem:** Token was saved but backend says "invalid"

**Likely Cause:** The `isActive` flag is `false` or backend is checking the wrong token

---

## 🚀 **Quick Fix - Run on Server:**

```bash
ssh root@23.128.116.9
cd /opt/dashboard/backend

# Option 1: Use psql to fix the token
psql "postgresql://neondb_owner:npg_JfHQa5Ir6KIW@ep-lingering-rain-a5cuycsw.us-east-2.aws.neon.tech/neondb?sslmode=require" << 'EOF'

-- Check current token status
SELECT 
    id, 
    "realmId", 
    "companyId", 
    "isActive", 
    "expiresAt",
    "createdAt",
    "lastUpdated"
FROM quickbooks.tokens 
ORDER BY "lastUpdated" DESC 
LIMIT 1;

-- Update the most recent token to be active
UPDATE quickbooks.tokens 
SET "isActive" = true 
WHERE id = (SELECT id FROM quickbooks.tokens ORDER BY "lastUpdated" DESC LIMIT 1)
RETURNING id, "realmId", "isActive", "expiresAt";

EOF

# Option 2: Restart PM2 to reload token
pm2 restart all

# Option 3: Test the sync again
curl -X POST http://localhost:5000/api/sync
```

---

## 🔍 **Check Backend Logs:**

```bash
pm2 logs --lines 50
```

Look for:
- `✅ Token loaded successfully`
- `❌ Token is invalid`
- Any errors about missing columns

---

## 🎯 **If Still Failing:**

The issue might be in `qboTokenManager.ts` - it's checking for the token but finding it invalid.

**Check these:**

1. **Token validation logic** in `backend/dist/services/qboTokenManager.js`
2. **Column names** - code might be looking for `isValid` but database has `isActive`
3. **Realm ID** - code might be comparing wrong realm ID

---

## 💡 **Alternative: Use sed to patch the compiled code**

```bash
cd /opt/dashboard/backend/dist/services

# Check what the current qboTokenManager is checking
grep -n "isValid\|isActive" qboTokenManager.js

# If it's checking isValid instead of isActive:
sed -i 's/isValid/isActive/g' qboTokenManager.js

# Restart
pm2 restart all
```

---

## ✅ **Expected Result After Fix:**

```bash
curl -X POST http://localhost:5000/api/sync
# Should return:
{"success":true,"message":"Synchronization completed successfully","stats":{...}}
```

---

**Try Option 1 first (psql update), then restart PM2!**

