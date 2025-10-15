# 🔍 Deep Dive: checkAndRefreshTokens Function

**Problem:** The function `checkAndRefreshTokens()` is returning false

---

## 🚀 **Find Out What It's Checking:**

```bash
cd /opt/dashboard/backend/dist/services

# Find the checkAndRefreshTokens function
echo "=== Finding checkAndRefreshTokens function ==="
grep -n "checkAndRefreshTokens" qboTokenManager.js

# Show the entire function (around line 60-120)
echo ""
echo "=== Showing checkAndRefreshTokens implementation ==="
sed -n '50,150p' qboTokenManager.js | grep -A 50 "checkAndRefreshTokens"

# OR use awk to extract the function
echo ""
echo "=== Full function ==="
awk '/async checkAndRefreshTokens/,/^    }/' qboTokenManager.js | head -60
```

---

## 🎯 **Check PM2 Logs for Actual Error:**

```bash
pm2 logs --lines 50 | grep -i "token\|error\|invalid"
```

---

## 💡 **Likely Issues:**

1. **Token not found** - Query returns no results
2. **Token expired** - `expiresAt` check failing
3. **Missing access token** - `accessToken` is NULL
4. **Refresh failing** - Can't refresh expired token

---

## 🔧 **Quick Fix: Check Token Data:**

```bash
cd /opt/dashboard/backend

cat > check-token-data.mjs << 'EOF'
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkToken() {
  try {
    const tokens = await sql`
      SELECT 
        id, 
        "realmId", 
        "isActive",
        "accessToken" IS NOT NULL as has_access_token,
        "refreshToken" IS NOT NULL as has_refresh_token,
        "expiresAt",
        "expiresAt" > NOW() as is_not_expired,
        NOW() as current_time
      FROM quickbooks.tokens 
      WHERE "realmId" = '9130354674010826'
      ORDER BY "lastUpdated" DESC;
    `;
    
    console.log('=== Token Status ===');
    tokens.forEach(t => {
      console.log(`ID: ${t.id}`);
      console.log(`  Realm ID: ${t.realmId}`);
      console.log(`  Is Active: ${t.isActive}`);
      console.log(`  Has Access Token: ${t.has_access_token}`);
      console.log(`  Has Refresh Token: ${t.has_refresh_token}`);
      console.log(`  Expires At: ${t.expiresAt}`);
      console.log(`  Is Not Expired: ${t.is_not_expired}`);
      console.log(`  Current Time: ${t.current_time}`);
      console.log('---');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkToken();
EOF

node check-token-data.mjs
```

---

**Run these commands to see what's actually in the token and what checkAndRefreshTokens is doing!**

