# Database Schema Mismatch Analysis

## Executive Summary

There are significant mismatches between the Supabase database schema and the project's Drizzle ORM schema definitions. This document identifies all issues and provides a remediation plan.

---

## Critical Issues Found

### 1. **QuickBooks Tokens Table** - CRITICAL

#### Supabase Database Schema (`quickbooks.tokens`)
```sql
- id (bigint, primary key)
- realm_id (text, NOT NULL)
- access_token (text, NOT NULL)
- refresh_token (text, NOT NULL)
- token_type (text)
- scope (text)
- expires_at (timestamp with time zone)
- refresh_token_expires_at (timestamp with time zone)
- environment (text)
- is_active (boolean, DEFAULT true, NOT NULL)
- created_at (timestamp with time zone, DEFAULT now(), NOT NULL)
- last_updated (timestamp with time zone, DEFAULT now(), NOT NULL)
```

#### Project Schema (`backend/src/db/schema.ts`)
```typescript
- id (bigint)
- accessToken (text)          // ❌ Wrong: should be access_token
- refreshToken (text)          // ❌ Wrong: should be refresh_token
- realmId (text)               // ❌ Wrong: should be realm_id
- expiresAt (timestamp)        // ❌ Wrong: should be expires_at
- createdAt (timestamp)        // ❌ Wrong: should be created_at
- lastUpdated (timestamp)      // ❌ Wrong: should be last_updated
// Missing columns:
// ❌ token_type
// ❌ scope
// ❌ refresh_token_expires_at
// ❌ environment
// ❌ is_active
```

#### Impact on `qboTokenManager.ts`
The token manager tries to use missing columns:
- Line 98: Comments mention `refreshTokenExpiresAt` not available
- Line 209: Comments mention `isActive` column missing
- Token refresh logic cannot properly track refresh token expiration
- Cannot mark tokens as inactive without deleting them

---

### 2. **QuickBooks Customers Table** - MODERATE

#### Supabase Database Schema (`quickbooks.customers`)
```sql
- id (text, primary key)
- realm_id (text, NOT NULL)
- display_name (text, NOT NULL)
- given_name, family_name, company_name (text)
- primary_email_addr (text)
- mobile_phone, primary_phone, alternate_phone, fax (text)
- website (text)
- bill_line1, bill_line2, bill_city, bill_state, bill_postal_code, bill_country (text)
- ship_line1, ship_line2, ship_city, ship_state, ship_postal_code, ship_country (text)
- taxable (boolean)
- balance (numeric(14,2), DEFAULT 0, NOT NULL)
- active (boolean, DEFAULT true, NOT NULL)
- notes (text)
- sync_token (text)
- metadata (jsonb)
- last_synced (timestamp with time zone)
- created_at (timestamp with time zone, DEFAULT now(), NOT NULL)
- last_updated (timestamp with time zone, DEFAULT now(), NOT NULL)
```

#### Project Schema (`backend/src/db/schema.ts`)
```typescript
- id (bigint)                  // ❌ Wrong: should be text
- Uses camelCase naming        // ❌ Wrong: should use snake_case
- Missing realm_id             // ❌ Critical for multi-tenant
- Missing proper address fields structure
- Column names don't match database at all
```

---

### 3. **QuickBooks Items Table** - MODERATE

#### Supabase Database Schema (`quickbooks.items`)
```sql
- id (text, primary key)
- realm_id (text, NOT NULL)
- name (text, NOT NULL)
- sku (text)
- description (text)
- type (text)
- active (boolean, DEFAULT true, NOT NULL)
- taxable (boolean)
- unit_price (numeric(14,2))
- sales_price (numeric(14,2))
- qty_on_hand (numeric(18,4))
- income_account_ref_id (text)
- expense_account_ref_id (text)
- asset_account_ref_id (text)
- sync_token (text)
- metadata (jsonb)
- last_synced (timestamp with time zone)
- created_at (timestamp with time zone, DEFAULT now(), NOT NULL)
- last_updated (timestamp with time zone, DEFAULT now(), NOT NULL)
```

#### Project Schema (`backend/src/db/schema.ts`)
```typescript
- id (bigint)                  // ❌ Wrong: should be text
- fully_qualified_name (text)  // ❌ Missing in DB
- Uses camelCase               // ❌ Wrong: should use snake_case
- Missing realm_id             // ❌ Critical for multi-tenant
- Missing many columns like name, active
```

---

### 4. **QuickBooks Invoices/Estimates** - MODERATE

Similar issues:
- Column naming mismatches (camelCase vs snake_case)
- Missing `realm_id` foreign key
- ID type mismatches (bigint vs text)
- Missing proper foreign key relationships

---

### 5. **Users Table Duplication** - MODERATE

The database has TWO user tables:
1. `public.users` - Supabase schema
2. `dashboard.users` - Also in Supabase

#### Supabase `public.users` Schema
```sql
- id (uuid, primary key)
- first_name, last_name (text, NOT NULL)
- address_line1, address_line2, city, state, zip_code, country (text)
- mobile_phone, home_phone (text)
- email (citext, NOT NULL, unique)
- username (citext, unique)
- password_hash (text)
- is_admin (boolean, DEFAULT false, NOT NULL)
- is_active (boolean, DEFAULT true, NOT NULL)
- on_leave (boolean, DEFAULT false, NOT NULL)
- hours_worked_this_week (numeric(10,2), DEFAULT 0, NOT NULL)
- hours_worked_last_week (numeric(10,2), DEFAULT 0, NOT NULL)
- pay_rate (numeric(10,2))
- admin_notes, employee_notes (text)
- last_login (timestamp with time zone)
- created_at, last_updated (timestamp with time zone, DEFAULT now(), NOT NULL)
```

#### Project `user-schema.ts`
```typescript
- id (serial)                  // ❌ Wrong: should be uuid
- Uses integer IDs             // ❌ Database uses UUID
- Missing many employee-related fields
```

**The project should use `public.users` or `dashboard.users`, not create its own.**

---

### 6. **Google Calendar Schema** - MODERATE

The database has a complete `google` schema with:
- `google.calendars`
- `google.calendar_events`
- `google.work_assignments`
- `google.employee_availability`

But the project's `calendar-schema.ts` doesn't use the `google` schema prefix and has different column names.

---

## Schema Naming Convention Issues

### Database Uses:
- **snake_case** for all column names
- **Schema namespaces**: `quickbooks`, `google`, `dashboard`, `public`
- **UUID** for user IDs
- **text** for QuickBooks entity IDs (not bigint)
- **Foreign keys** with proper `realm_id` references

### Project Uses:
- **camelCase** for column names
- **No schema namespaces** in Drizzle definitions
- **serial/bigint** for IDs instead of UUID/text
- **Missing realm_id** foreign keys

---

## Remediation Plan

### Phase 1: Critical Fixes (Do First)
1. ✅ **Fix `quickbooks.tokens` schema** to match database
2. ✅ **Update `qboTokenManager.ts`** to use correct column names
3. ✅ **Add missing columns**: `is_active`, `refresh_token_expires_at`, `token_type`, `scope`, `environment`

### Phase 2: QuickBooks Schema Updates
4. ✅ Update `quickbooks.customers` schema
5. ✅ Update `quickbooks.items` schema
6. ✅ Update `quickbooks.invoices` schema
7. ✅ Update `quickbooks.estimates` schema
8. ✅ Add `realm_id` foreign keys
9. ✅ Fix all ID types (text vs bigint)

### Phase 3: User Schema Alignment
10. ✅ Decide: Use `public.users` or `dashboard.users`
11. ✅ Update `user-schema.ts` to match database
12. ✅ Change user IDs from serial to UUID
13. ✅ Add all missing employee fields

### Phase 4: Google Calendar Schema
14. ✅ Add `google` schema namespace
15. ✅ Update column names to snake_case
16. ✅ Verify foreign key relationships

### Phase 5: Service Updates
17. ✅ Update all services to use correct column names
18. ✅ Update sync services (syncService.ts, upserts.ts)
19. ✅ Fix all imports and type references

---

## Migration Strategy

### Option A: Schema-First (Recommended)
- Database is the source of truth
- Update Drizzle schema to match database exactly
- Use snake_case in database, map to camelCase in services if needed
- Preserve all existing data

### Option B: Code-First (Not Recommended)
- Create migrations to change database
- Risk of data loss
- Breaking changes for existing data
- NOT recommended given the extensive changes needed

---

## Files That Need Updates

### Schema Files
- ✅ `backend/src/db/schema.ts` - QuickBooks tables
- ✅ `backend/src/db/user-schema.ts` - User tables
- ✅ `backend/src/db/calendar-schema.ts` - Google Calendar tables

### Service Files
- ✅ `backend/src/services/qboTokenManager.ts`
- ✅ `backend/src/services/qboClient.ts`
- ✅ `backend/src/services/syncService.ts`
- ✅ `backend/src/services/upserts.ts`
- ✅ `backend/src/services/userService.ts`

### Route Files
- All QuickBooks routes (`customers.ts`, `invoices.ts`, `estimates.ts`, `items.ts`)
- Calendar routes
- User routes

---

## Next Steps

1. **Review this analysis** with the team
2. **Get approval** to proceed with Schema-First approach
3. **Back up database** before making any changes
4. **Update schema files** one at a time
5. **Test each update** thoroughly
6. **Update services** to use new schema
7. **Run integration tests**

---

## Questions to Answer

1. Should we use `public.users` or `dashboard.users`?
2. Should we create a migration to clean up duplicate user tables?
3. Do we need to maintain backward compatibility?
4. Should we create a comprehensive test suite first?

---

**Status:** ⚠️ CRITICAL - Immediate attention required
**Priority:** P0 - Blocking production deployment
**Owner:** Development Team
**Last Updated:** 2025-10-15

