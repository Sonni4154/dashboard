# Database Migrations & Schema

## 📌 Important Note

**This project uses Supabase as the database provider.**

The authoritative database schema is maintained in:
- **`/supabase/schema.sql`** - Complete PostgreSQL schema dump from Supabase

The application uses Drizzle ORM with schema definitions in:
- **`/backend/src/db/schema.ts`** - Drizzle schema (aligned with Supabase)

---

## 🗄️ Database Structure

The database uses multiple schemas for organization:

### Schemas:
- `quickbooks.*` - QuickBooks data (tokens, customers, items, invoices, estimates)
- `google.*` - Google Calendar integration
- `dashboard.*` - Dashboard-specific data (users, roles, permissions)
- `jibble.*` - Time tracking integration
- `import.*` - Data import/staging tables
- `neon_auth.*` - Legacy auth (Stack Auth is now used)

---

## 🔄 Migration Strategy

### ⚠️ Do NOT use traditional migrations

Since this project uses Supabase:

1. **Schema changes are made directly in Supabase**
   - Use Supabase Studio UI, or
   - Use Supabase CLI migrations

2. **Export the updated schema**
   ```bash
   supabase db dump > supabase/schema.sql
   ```

3. **Update Drizzle schema to match**
   - Manually update `backend/src/db/schema.ts`
   - Ensure column names, types, and relations match

4. **No Drizzle migrations needed**
   - Drizzle is used for ORM only, not migrations
   - Schema changes happen in Supabase first

---

## 🛠️ Development Workflow

### Making Schema Changes:

1. **In Supabase:**
   ```sql
   -- Make changes in Supabase SQL Editor
   ALTER TABLE quickbooks.tokens ADD COLUMN new_field TEXT;
   ```

2. **Export schema:**
   ```bash
   supabase db dump --schema quickbooks,google,dashboard > supabase/schema.sql
   ```

3. **Update Drizzle schema:**
   ```typescript
   // backend/src/db/schema.ts
   export const tokens = qb.table('tokens', {
     // ... existing columns
     new_field: text('new_field'),
   });
   ```

4. **Test locally:**
   ```bash
   cd backend
   npm run check  # TypeScript validation
   npm run dev    # Test runtime
   ```

---

## 📋 Schema Validation

To ensure Drizzle schema matches Supabase:

```bash
# Check TypeScript types
cd backend
npm run check

# Verify database connection
npm run dev
# Check logs for schema errors
```

---

## 🚨 Common Issues

### Schema Mismatch
**Problem:** Column names don't match between Drizzle and database

**Solution:**
1. Check `supabase/schema.sql` for actual column names
2. Update `backend/src/db/schema.ts` to use exact names (snake_case)
3. Ensure relations use correct column names

### Missing Columns
**Problem:** Drizzle references columns that don't exist

**Solution:**
1. Export fresh schema: `supabase db dump > supabase/schema.sql`
2. Compare with `backend/src/db/schema.ts`
3. Add missing columns or remove references

---

## 📚 Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Schema Design](https://www.postgresql.org/docs/current/ddl-schemas.html)

---

**Note:** This folder (`backend/db/`) is kept for future custom migration needs, but is currently **not used** for schema management.

