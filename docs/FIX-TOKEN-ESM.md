# 🔧 Fix Token (ES Module Version)

**Run this on your server:**

```bash
cd /opt/dashboard/backend

# Create ES module version
cat > fix-token.mjs << 'ENDSCRIPT'
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixToken() {
  try {
    console.log('🔧 Updating token to be active...');
    
    const result = await sql`
      UPDATE quickbooks.tokens 
      SET "isActive" = true 
      WHERE "realmId" = '9130354674010826'
      RETURNING id, "realmId", "isActive", "expiresAt";
    `;
    
    console.log('✅ Token updated:', result);
    
    console.log('🔍 Verifying token status...');
    const check = await sql`
      SELECT id, "realmId", "isActive", "expiresAt" 
      FROM quickbooks.tokens 
      WHERE "realmId" = '9130354674010826';
    `;
    
    console.log('✅ Current token:', check);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixToken();
ENDSCRIPT

# Run it
node fix-token.mjs

# Then restart PM2 and test
pm2 restart all
sleep 5
curl -X POST http://localhost:5000/api/sync
```

---

## 🎯 **Alternative: Check if code uses wrong column name**

```bash
cd /opt/dashboard/backend/dist/services

# Check what the code is looking for
grep -n "isValid" qboTokenManager.js

# If it shows "isValid" instead of "isActive":
cp qboTokenManager.js qboTokenManager.js.backup
sed -i 's/\.isValid/.isActive/g' qboTokenManager.js
sed -i 's/isValid:/isActive:/g' qboTokenManager.js

pm2 restart all
curl -X POST http://localhost:5000/api/sync
```

---

**Try the .mjs version first!** 🚀

