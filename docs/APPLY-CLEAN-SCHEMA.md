# 🔄 Apply Clean Schema from migrate.txt

**Goal:** Apply the proper schema while preserving all existing QuickBooks data

**Risk Level:** Medium - We'll backup first and can rollback if needed

---

## ⚠️ **What Will Change:**

### **Column Renames (snake_case standardization):**

**quickbooks.tokens:**
- `accessToken` → `access_token`
- `refreshToken` → `refresh_token`
- `realmId` → `realm_id`
- `expiresAt` → `expires_at`
- `createdAt` → `created_at`
- `lastUpdated` → `last_updated`
- `refreshTokenExpiresAt` → `refresh_token_expires_at`
- `tokenType` → `token_type`
- `companyId` → KEEP (will map to realm_id)
- `isActive` → `is_active`
- `baseUrl` → `base_url`

**quickbooks.customers:**
- `displayname` → `display_name`
- `companyname` → `company_name`
- `primaryphone_freeformnumber` → `primary_phone`
- `primaryemailaddr_address` → `primary_email_addr`
- `mobile_freeformnumber` → `mobile_phone`
- `billaddr_*` → `bill_*` (simplified)
- `shipaddr_*` → `ship_*` (simplified)

**quickbooks.items:**
- `fully_qualified_name` → `name` (simplified)
- `unitprice` → `unit_price`
- `salesprice` → `sales_price`
- `qtyonhand` → `qty_on_hand`
- `taxclassificationref_*` → Removed (store in metadata jsonb)

**quickbooks.invoices:**
- `docnumber` → `doc_number`
- `totalamt` → `total_amt`
- `customerref_*` → `customer_*`
- `metadata_lastupdatedtime` → `metadata_last_updated_time`

---

## 🎯 **Strategy: Safe Migration**

### **Option 1: Fresh Start** (Cleanest, requires downtime)

1. **Create backup of current data**
2. **Drop and recreate tables with new schema**
3. **Resync all data from QuickBooks**
4. **Update TypeScript schema to match**
5. **Rebuild backend**

**Pros:** Clean schema, no legacy issues  
**Cons:** 15-30 minute downtime for resync

### **Option 2: Gradual Migration** (Safer, no downtime)

1. **Add new columns alongside old ones**
2. **Copy data from old → new columns**
3. **Update code to use new columns**
4. **Drop old columns when ready**

**Pros:** No downtime, can rollback easily  
**Cons:** More complex, tables temporarily larger

### **Option 3: Keep Current + Fix Only Broken Parts** (Fastest)

1. **Keep current naming** (don't rename columns)
2. **Just add missing columns** (we already did this)
3. **Fix the companyId issue** (sed command)
4. **Resync data**

**Pros:** Works immediately, minimal risk  
**Cons:** Schema remains inconsistent

---

## ✅ **My Recommendation: Option 3 for Now**

**Why:**
- Your QuickBooks integration is working
- Frontend is functional
- You have 1,310 records (576 customers + 100 items + 634 invoices)
- Resyncing takes time

**What to do:**
1. ✅ Fix the `companyId` issue (I already made it nullable)
2. ✅ Reconnect QuickBooks (will work now)
3. ✅ Run sync to populate pricing data
4. ✅ Deploy frontend changes
5. ✅ Test everything works

**Later** (when you have a maintenance window):
- Apply the clean `migrate.txt` schema
- Update all TypeScript code
- Get backend compiling again

---

## 🚀 **Try Reconnecting Now:**

Since I made `companyId` nullable, this should work:

**Visit:** https://www.wemakemarin.com/api/qbo/connect

**Expected:** ✅ Success page with "QuickBooks Connected Successfully!"

---

## 📋 **If You Still Want to Apply migrate.txt:**

I can create a migration script that:
1. Renames columns safely
2. Preserves all data
3. Updates indexes
4. Can be rolled back if needed

**But** I recommend doing that later when:
- You have time for testing
- Can afford brief downtime
- Want to fix TypeScript compilation

**For now:** Just reconnect QB and sync the data! 🚀

---

**Try the reconnect now - it should work since companyId is nullable!**
