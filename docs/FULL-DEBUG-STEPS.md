# 🔍 Full Debug Steps

**Run these commands in order:**

---

## **Step 1: Check PM2 Logs**

```bash
pm2 logs marin-backend --lines 100 --nostream
```

Look for error messages about:
- Token not found
- Token expired
- Missing accessToken
- Database query errors

---

## **Step 2: Check Token Data**

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
        NOW() as current_time,
        "lastUpdated"
      FROM quickbooks.tokens 
      WHERE "realmId" = '9130354674010826'
      ORDER BY "lastUpdated" DESC;
    `;
    
    console.log('=== Token Status ===');
    tokens.forEach(t => {
      console.log(`\nToken ID: ${t.id}`);
      console.log(`  Is Active: ${t.isActive}`);
      console.log(`  Has Access Token: ${t.has_access_token}`);
      console.log(`  Has Refresh Token: ${t.has_refresh_token}`);
      console.log(`  Expires At: ${t.expiresAt}`);
      console.log(`  Is Not Expired: ${t.is_not_expired}`);
      console.log(`  Current Time: ${t.current_time}`);
      console.log(`  Last Updated: ${t.lastUpdated}`);
    });
    
    if (tokens.length === 0) {
      console.log('\n❌ NO TOKENS FOUND!');
    } else if (!tokens[0].has_access_token) {
      console.log('\n❌ ACCESS TOKEN IS MISSING!');
    } else if (!tokens[0].is_not_expired) {
      console.log('\n❌ TOKEN IS EXPIRED!');
    } else if (!tokens[0].isActive) {
      console.log('\n❌ TOKEN IS NOT ACTIVE!');
    } else {
      console.log('\n✅ TOKEN LOOKS GOOD!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkToken();
EOF

node check-token-data.mjs
```

---

## **Step 3: Check checkAndRefreshTokens Function**

```bash
cd /opt/dashboard/backend/dist/services

# Extract the function
echo "=== checkAndRefreshTokens function ==="
awk '/async checkAndRefreshTokens/,/^    async refreshAccessToken/' qboTokenManager.js | head -80
```

---

## **Step 4: If Token is Missing or Expired:**

The new token might not have been saved correctly. Reconnect again:

Visit: https://www.wemakemarin.com/api/qbo/connect

Then restart and try sync again.

---

## **Step 5: If Token Exists but Query Fails:**

The query might be looking for wrong column names. Check what query it uses:

```bash
cd /opt/dashboard/backend/dist/services
grep -A 10 "db.query.tokens" qboTokenManager.js | head -20
grep -A 10 "SELECT.*FROM.*tokens" qboTokenManager.js | head -20
```

---

**Start with Step 1 and 2 - show me the output!**

