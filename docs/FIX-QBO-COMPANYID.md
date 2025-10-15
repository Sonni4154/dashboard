# 🔧 Fix QuickBooks OAuth - Add companyId

**Problem:** OAuth callback doesn't set `companyId`, causing "null value violates not-null constraint"

**Solution:** Add `companyId: realmId` to the token insert

---

## 🚀 Run This on Your Server:

```bash
cd /opt/dashboard/backend

# Backup the file
cp dist/routes/qbo-oauth.js dist/routes/qbo-oauth.js.backup

# Add companyId: realmId after line 101
sed -i '101 a\            companyId: realmId,' dist/routes/qbo-oauth.js

# Verify the fix
grep -A 5 "realmId: realmId" dist/routes/qbo-oauth.js

# Should show:
#   realmId: realmId,
#   companyId: realmId,  <-- NEW LINE
#   expiresAt,

# Restart PM2
pm2 restart all

# Now reconnect QuickBooks
echo "Go to: https://www.wemakemarin.com/api/qbo/connect"
```

---

## ✅ After Running Above:

Visit: **https://www.wemakemarin.com/api/qbo/connect**

This will now work and save the token with `companyId` set!

---

## 🎯 Why This Happened:

The TypeScript source has `companyId` in the schema, but the compiled JavaScript doesn't set it. This is another example of the schema drift issue.

**The Fix:** Just add one line to set `companyId: realmId` in the compiled code.

---

**Run the commands above on your server, then reconnect QB!** 🚀
