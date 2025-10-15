# 🚨 URGENT TODO - Database & UI Fixes

**Date:** October 11, 2025  
**Status:** UI Fixed, Database Needs Resync

---

## ✅ COMPLETED (Just Now)

### **1. UI Styling - All Pages Match Products** ✅
- Dark purple background (theme default)
- White text (text-foreground)
- Cards use `transition-shadow hover:shadow-md`
- All pages consistent

### **2. Pagination Added** ✅
- Customers, Invoices, Products all have pagination
- Choose 10, 25, 50, or 100 per page
- Shows "Page X of Y" and "Showing 1-25 of 576"

### **3. Sorting Added** ✅
- **Invoices:** Sort by Date or Amount
- **Customers:** Sort by Alpha, Reverse Alpha, Amount Owed, Last Invoice

### **4. Invoice Display** ✅
- Customer Name is large heading
- Invoice # is small text below

### **5. Customer Badge** ✅
- Red "Unpaid" / Green "Paid" style (matches invoices)

### **6. Database Columns Added** ✅
- Added 17 columns to `quickbooks.items`:
  - `name`, `active`, `unitprice`, `salesprice`, `qtyonhand`
  - `type`, `taxable`, `invstartdate`
  - Account references, timestamps

---

## 🚨 CRITICAL: Data is Missing Prices!

### **Problem:**
The `items` table has the columns NOW, but they're all NULL because the data was synced BEFORE the columns existed.

### **Solution:**
**Run a full QuickBooks sync** to repopulate items with pricing data:

```bash
ssh root@23.128.116.9

# Trigger full sync
curl -X POST http://localhost:5000/api/sync

# Or use the public endpoint
curl -X POST https://api.wemakemarin.com/api/sync
```

This will:
1. Fetch all 100 items from QuickBooks
2. Extract `UnitPrice`, `Type`, `QtyOnHand`, etc.
3. Update the database with the new columns filled

---

## 📋 Deploy Frontend Changes

```powershell
# Upload the 3 updated files
scp frontend/src/pages/invoices.tsx root@23.128.116.9:/opt/dashboard/frontend/src/pages/
scp frontend/src/pages/customers.tsx root@23.128.116.9:/opt/dashboard/frontend/src/pages/
scp frontend/src/pages/products.tsx root@23.128.116.9:/opt/dashboard/frontend/src/pages/
```

```bash
# Rebuild frontend
ssh root@23.128.116.9
cd /opt/dashboard/frontend
npm run build
sudo systemctl reload nginx
```

---

## 🎯 After Sync Completes

Products page will show:
- ✅ Actual prices (from `unitprice` or `salesprice`)
- ✅ Product type (Inventory, Service, Non-Inventory)
- ✅ Quantity on hand
- ✅ Sortable by type

---

## 📚 Next: Apply Complete Migration

The `docs/migrate.txt` file has the COMPLETE schema with proper naming conventions. Key differences:

**Current DB:**
- `unitprice` (no underscore)
- `qtyonhand` (no underscore)  
- Mixed naming conventions

**Proper Schema (from migrate.txt):**
- `unit_price` (with underscore)
- `qty_on_hand` (with underscore)
- Consistent snake_case

**Options:**
1. **Keep current schema** - Just resync data to fill existing columns
2. **Migrate to proper schema** - Rename columns to match migrate.txt (more work but cleaner)

**Recommendation:** Keep current schema for now, just resync the data. Later we can gradually migrate to the proper naming convention.

---

## ✅ Summary

**UI:** Ready to deploy (all 3 pages fixed)  
**Database:** Columns added, need to resync data  
**Next Step:** Run sync, then rebuild frontend

---

*Deploy the frontend, run the sync, and you're done!* 🚀
