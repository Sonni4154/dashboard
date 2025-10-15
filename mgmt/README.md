# 🛠️ Management Scripts & Utilities

This folder contains utility scripts, migration helpers, and debugging tools used for development and maintenance.

---

## 📂 Script Categories

### 🔍 Check Scripts
Diagnostic scripts to verify database state and data integrity:

- `check-all-items.mjs` - Verify all QuickBooks items in database
- `check-items-columns.mjs` - Check items table column structure
- `check-items-schema.js/mjs` - Validate items schema
- `check-new-token.mjs` - Verify new token structure
- `check-pricing-data.mjs` - Validate pricing data
- `check-tables-and-fix-fk.mjs` - Check and fix foreign keys

### 🧪 Test Scripts
Testing scripts for QuickBooks integration:

- `test-qbo-connection.sh` - **Automated test suite** for QB connection
- `test-qbo-item.mjs` - Test single item API
- `test-qbo-items-api.mjs` - Test items endpoint
- `test-qbo.mjs` - General QuickBooks API tests

### 🔧 Fix Scripts
Migration and repair utilities:

- `fix-backend-errors.ps1` - Backend error repairs
- `fix-invoices-column.sh` - Invoice column fixes
- `fix-qbo-oauth.sh` - OAuth flow fixes
- `fix-tables-id.mjs` - ID type conversions

### 🚀 Deploy Scripts
Deployment utilities (mostly legacy):

- `deploy-auth-fix.ps1` - Auth system deployment
- `deploy-user-system.ps1/sh` - User management deployment
- `deploy-minimal-backend.ps1` - Legacy deployment script
- `deploy-simple-*.ps1` - Legacy simple deployments

**Note:** Most deploy scripts are legacy. Use standard `npm run build` and PM2 scripts instead.

### 🔄 Sync Scripts
Data synchronization utilities:

- `sync-qbo-data.mjs` - Full QuickBooks data sync
- `sync-qbo-simple.mjs` - Simple sync test
- `create-estimate-line-items.mjs` - Create estimate line items

### 🐛 Debug Scripts
Debugging and troubleshooting:

- `debug-qbo-api.mjs` - Debug QuickBooks API calls
- `activate-new-token.mjs` - Manually activate tokens
- `add-last-updated-column.mjs` - Add last_updated columns
- `add-qty-column.mjs` - Add qty columns

### 📅 Integration Scripts
Third-party integrations:

- `google-calendar-oauth-setup.mjs` - Google Calendar OAuth setup

---

## 🎯 Recommended Scripts to Use

### Daily Operations
✅ **Use these:**
- `test-qbo-connection.sh` - Comprehensive connection testing
- `sync-qbo-data.mjs` - Manual data sync (if auto-sync fails)

### Development
✅ **Useful for dev:**
- `check-all-items.mjs` - Verify data integrity
- `debug-qbo-api.mjs` - Debug API issues

### One-Time Setup
✅ **Setup only:**
- `google-calendar-oauth-setup.mjs` - Initial Google Calendar setup

---

## ⚠️ Legacy/Deprecated Scripts

These scripts were used during migration but are no longer needed:

- ❌ `fix-*` scripts - Schema is now aligned
- ❌ `deploy-simple-*` - Use standard deployment
- ❌ Most `check-*` scripts - Database is stable

**Keep for reference** but not required for normal operations.

---

## 🚀 Running Scripts

### Node.js Scripts (.mjs)
```bash
node mgmt/script-name.mjs
```

### PowerShell Scripts (.ps1)
```powershell
.\mgmt\script-name.ps1
```

### Bash Scripts (.sh)
```bash
./mgmt/script-name.sh
```

---

## 📝 Notes

- Most scripts require proper environment variables
- Check script contents before running
- Some scripts may modify database data
- Always backup before running fix/migration scripts

---

**Location:** `/mgmt/`  
**Purpose:** Development & maintenance utilities  
**Status:** Mostly legacy, keep for reference

