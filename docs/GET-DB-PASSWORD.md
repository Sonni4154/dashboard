# 🔐 Get Database Password from .env

**Problem:** The psql connection is using the wrong password

**Solution:** Use the password from your backend's `.env` file

---

## 🚀 **Run These Commands on Server:**

```bash
cd /opt/dashboard/backend

# Get the database URL from .env
grep DATABASE_URL .env

# It should show something like:
# DATABASE_URL="postgresql://neondb_owner:CORRECT_PASSWORD@ep-lingering-rain-a5cuycsw.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Then run this script that uses the .env password:
node << 'EOF'
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixToken() {
  try {
    // Update the token to be active
    const result = await sql`
      UPDATE quickbooks.tokens 
      SET "isActive" = true 
      WHERE "realmId" = '9130354674010826'
      RETURNING id, "realmId", "isActive", "expiresAt";
    `;
    
    console.log('✅ Token updated:', result);
    
    // Verify it worked
    const check = await sql`
      SELECT id, "realmId", "isActive", "expiresAt" 
      FROM quickbooks.tokens 
      WHERE "realmId" = '9130354674010826';
    `;
    
    console.log('✅ Current token status:', check);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixToken();
EOF

# After that runs successfully:
pm2 restart all
sleep 5
curl -X POST http://localhost:5000/api/sync
```

---

## 🎯 **Alternative: Check for isValid vs isActive**

If the token is already active but the code is looking for the wrong column:

```bash
cd /opt/dashboard/backend/dist/services

# Check what column the code is checking
grep -n "isValid\|isActive" qboTokenManager.js

# If it shows "isValid", replace it:
sed -i 's/\.isValid/.isActive/g' qboTokenManager.js
sed -i 's/isValid:/isActive:/g' qboTokenManager.js

pm2 restart all
```

---

**Try the Node.js script first - it will use the correct password from your .env file!**

