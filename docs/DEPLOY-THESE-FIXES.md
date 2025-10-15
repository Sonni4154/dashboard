# 🚀 Deploy Latest UI Fixes

**Date:** October 11, 2025  
**Files Changed:** 3 frontend files  
**Changes:** Dark theme with white text + pagination controls

---

## ✅ What Was Fixed

### **1. Dark Background with White Text** ✅
- Reverted invoices and customers to dark theme (like products page)
- White/gray text for better contrast on dark background
- Matches the rest of the dashboard design

### **2. Pagination Controls Added** ✅
- All three pages now have pagination:
  - **Customers** - Choose 10/25/50/100 per page
  - **Invoices** - Choose 10/25/50/100 per page
  - **Products** - Choose 10/25/50/100 per page
- Shows "Page X of Y" and "Showing 1-25 of 576"
- Previous/Next buttons

### **3. Invoice Display Fixed** ✅
- **Customer Name** is now the large heading (text-xl)
- **Invoice #** is now small gray text below customer name
- Proper QuickBooks fields used:
  - `customerref_name` for customer
  - `docnumber` for invoice number
  - `totalamt` or `balance` for amount
  - `txndate` for date

### **4. Customer Badge Fixed** ✅
- Shows **"$X.XX Owed"** in red if balance > 0
- Shows **"Paid Up"** in gray outline if balance = 0
- Removed "Outstanding" text

---

## 🚀 Deploy to Server

### **Option 1: Upload Files** (Recommended - 2 minutes)

```powershell
# From Windows PowerShell
scp frontend/src/pages/invoices.tsx root@23.128.116.9:/opt/dashboard/frontend/src/pages/
scp frontend/src/pages/customers.tsx root@23.128.116.9:/opt/dashboard/frontend/src/pages/
scp frontend/src/pages/products.tsx root@23.128.116.9:/opt/dashboard/frontend/src/pages/
scp frontend/src/lib/api.ts root@23.128.116.9:/opt/dashboard/frontend/src/lib/
```

Then rebuild:
```bash
ssh root@23.128.116.9
cd /opt/dashboard/frontend
npm run build
sudo systemctl reload nginx
```

---

### **Option 2: Git Push/Pull** (If preferred - 5 minutes)

```bash
# Local
git add frontend/src/pages/invoices.tsx frontend/src/pages/customers.tsx frontend/src/pages/products.tsx frontend/src/lib/api.ts
git commit -m "Add pagination controls and fix UI styling"
git push

# Server
ssh root@23.128.116.9
cd /opt/dashboard
git pull
cd frontend
npm run build
sudo systemctl reload nginx
```

---

## 🧪 Test After Deploy

Visit these pages:
- https://wemakemarin.com/customers
  - Should show dark background with white text
  - Pagination controls at bottom
  - "$X.XX Owed" badges in red
  - Shows 25 per page by default

- https://wemakemarin.com/invoices
  - Should show dark background with white text
  - Customer Name large, Invoice # small
  - Pagination controls at bottom
  - Shows 25 per page by default

- https://wemakemarin.com/products
  - Should show all 100 items
  - Pagination controls at bottom
  - Shows 25 per page by default

---

## 📋 Next: Database Schema Updates

Based on the PDF you provided, I need to update the database schema to add missing columns. The PDF specifies:

### **Missing/Incomplete Tables:**

**Users table** needs:
- address fields (address_line1, address_line2, city, state, zip_code, country)
- phone fields (mobile_phone, home_phone)
- google_id (for Google OAuth)
- employment_status
- pay_rate
- hours_worked_this_week, hours_worked_last_week
- admin_notes, employee_notes

**QuickBooks tables** need more fields (I already added most of these, but let me verify).

**Calendar tables** - Need to ensure all fields from the PDF spec are present.

---

## ✅ Summary

**Files to Deploy:**
1. `frontend/src/pages/invoices.tsx` - Dark theme, customer name large, pagination
2. `frontend/src/pages/customers.tsx` - Dark theme, amount owed in red, pagination
3. `frontend/src/pages/products.tsx` - Pagination controls
4. `frontend/src/lib/api.ts` - Pagination support (limit=1000)

**Deploy Now:** Use Option 1 above to upload and rebuild!

**After Deploy:** We'll update the database schema based on the PDF spec.

---

*Ready to deploy! Upload the 4 files and rebuild the frontend!* 🚀
