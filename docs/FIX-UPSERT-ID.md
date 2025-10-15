# 🔧 Fix Upsert ID Issue

**Problem:** Line 24 of upserts.ts has `id: item.Id` which tries to insert QB's ID into our auto-increment column

**Solution:** Remove `id` from the itemData object

---

## 🚀 **Quick Fix:**

```bash
cd /opt/dashboard/backend/dist/services

# Backup
cp upserts.js upserts.js.backup2

# Find the problematic line
grep -n "id: item.Id" upserts.js

# Remove the id field from itemData
# This is tricky with sed, so let's use a more surgical approach

# Show the context around the line
grep -B 2 -A 20 "id: item.Id" upserts.js | head -25

# If it shows the id field, remove it (assuming it's around line 23-24 in the compiled JS)
sed -i '/id: item\.Id,/d' upserts.js

# Verify it's removed
grep -n "id: item.Id" upserts.js
# Should show nothing

# Restart
pm2 restart all
sleep 5

# Test sync
curl -X POST http://localhost:5000/api/sync
```

---

## 🎯 **Expected Result:**

The sync should start working and populate:
- ✅ Customers
- ✅ Items (with pricing!)
- ✅ Invoices

---

**Run those commands now!** 🚀

