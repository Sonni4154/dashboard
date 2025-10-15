# 🔍 Check Token Manager Logic

**Problem:** Tokens are active but backend says "invalid"

**Likely causes:**
1. Code is checking for `isValid` column (doesn't exist)
2. Code is checking wrong realm ID
3. Code has other validation logic

---

## 🚀 **Check What the Code is Looking For:**

```bash
cd /opt/dashboard/backend/dist/services

# Check qboTokenManager for validation logic
grep -n "invalid\|isValid\|isActive" qboTokenManager.js | head -20

# Check what columns it's selecting
grep -n "SELECT.*tokens" qboTokenManager.js | head -10

# Check for token validation function
grep -A 10 "validateToken\|isTokenValid\|checkToken" qboTokenManager.js
```

---

## 🎯 **If it's checking for `isValid`:**

```bash
cd /opt/dashboard/backend/dist/services

# Backup first
cp qboTokenManager.js qboTokenManager.js.backup

# Replace isValid with isActive
sed -i 's/\.isValid/.isActive/g' qboTokenManager.js
sed -i 's/"isValid"/"isActive"/g' qboTokenManager.js
sed -i 's/isValid:/isActive:/g' qboTokenManager.js

# Restart
pm2 restart all
sleep 5
curl -X POST http://localhost:5000/api/sync
```

---

## 🔍 **Check PM2 Logs for Clues:**

```bash
pm2 logs --lines 30
```

Look for:
- `Token loaded`
- `Token validation failed`
- Error messages about columns

---

## 🎯 **Alternative: Check if multiple tokens are causing issues**

Since you have 2 tokens with the same realm ID, maybe it's picking the wrong one:

```bash
cd /opt/dashboard/backend

# Delete the old token, keep only the newest
cat > delete-old-token.mjs << 'ENDSCRIPT'
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function cleanupTokens() {
  try {
    console.log('🔧 Deleting old token...');
    
    // Keep only the most recent token
    const result = await sql`
      DELETE FROM quickbooks.tokens 
      WHERE id = '1759926944520'
      RETURNING id, "realmId";
    `;
    
    console.log('✅ Deleted:', result);
    
    const check = await sql`
      SELECT id, "realmId", "isActive", "expiresAt", "accessToken"
      FROM quickbooks.tokens 
      WHERE "realmId" = '9130354674010826';
    `;
    
    console.log('✅ Remaining tokens:', check.map(t => ({ id: t.id, realmId: t.realmId, isActive: t.isActive, hasAccessToken: !!t.accessToken })));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupTokens();
ENDSCRIPT

node delete-old-token.mjs
pm2 restart all
sleep 5
curl -X POST http://localhost:5000/api/sync
```

---

**Try checking the qboTokenManager.js file first to see what it's looking for!**

