# 🔧 Fix ID Insert Error

**Problem:** Code is trying to insert `id` values but the column is `GENERATED ALWAYS AS IDENTITY`

**Solution:** Remove `id` from the INSERT statements in upserts

---

## 🚀 **Find and Fix the Upsert Logic:**

```bash
cd /opt/dashboard/backend/dist/services

# Check which upsert is failing
pm2 logs --lines 20 | grep -i "insert\|error"

# Backup upserts.js
cp upserts.js upserts.js.backup

# Check what's being inserted
grep -n "\.insert(" upserts.js | head -20

# The issue is likely that QuickBooks 'Id' is being inserted into our auto-increment 'id' column
# We need to remove 'id' from the insert and store QB's Id in a different field

# Quick fix: Check if there's a conflict on 'id' in the INSERT
grep -B 5 -A 5 "onConflictDoUpdate" upserts.js | head -30
```

---

## 🎯 **Likely Fix:**

The upsert is trying to insert QuickBooks's `Id` (string like "123") into our database's `id` (auto-increment bigint).

**Option 1:** Remove `id` from the insert values
**Option 2:** Use `qbo_id` or similar field for QuickBooks's ID

---

## 🔍 **Check the Schema:**

```bash
cd /opt/dashboard/backend

# Check what columns customers table has
cat > check-customer-schema.mjs << 'EOF'
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  const columns = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'quickbooks' 
    AND table_name = 'customers'
    ORDER BY ordinal_position;
  `;
  
  console.log('=== Customers Table Schema ===');
  columns.forEach(c => {
    console.log(`${c.column_name} (${c.data_type}) - Default: ${c.column_default || 'none'}`);
  });
}

checkSchema();
EOF

node check-customer-schema.mjs
```

---

## 💡 **Quick Fix (if id is the problem):**

```bash
cd /opt/dashboard/backend/dist/services

# Find where id is being set in customer upsert
grep -n "id:" upserts.js | grep -i customer

# If it shows something like "id: customer.Id", remove it
# We'll need to see the actual line to fix it properly
```

---

**Run the schema check first to see what columns exist!**

