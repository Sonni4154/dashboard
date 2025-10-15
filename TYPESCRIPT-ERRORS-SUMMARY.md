# TYPESCRIPT ERRORS SUMMARY
## Marin Pest Control Dashboard - Backend TypeScript Issues

### Current Status: 61 TypeScript Errors in 13 Files

### Error Categories:

## 1. MISSING SCHEMA COLUMNS (Database Schema Mismatch)

### Tokens Table Issues:
- **Missing columns**: `token_type`, `expires_at`, `is_active`
- **Files affected**: `qbo-oauth.ts`, `tokenInitializer.ts`, `tokenRefresher.ts`, `qboClient.ts`, `qboTokenManager.ts`

### Users Table Issues:
- **Missing columns**: `password_hash`, `last_login`, `last_updated`
- **Files affected**: `userService.ts`, `auth.ts`

### Calendar Events Table Issues:
- **Missing columns**: `description`, `assigned_by`, `entity_id`
- **Files affected**: `calendar.ts`, `googleCalendar.ts`

### Time Entries Table Issues:
- **Missing columns**: `clock_in`, `clock_out`, `approved`
- **Files affected**: `calendar.ts`

### Items Table Issues:
- **Missing columns**: `sku`
- **Files affected**: `upserts.ts`

### Work Assignments Table Issues:
- **Missing columns**: `assigned_by`, `entity_id`
- **Files affected**: `calendar.ts`

## 2. SERVICE REFERENCE ERRORS

### UserServiceSimple References:
- **Issue**: References to non-existent `UserServiceSimple` class
- **Files affected**: `customAuth.ts`, `auth.ts`
- **Fix needed**: Replace with `UserService`

## 3. TYPE MISMATCHES

### User ID Type Issues:
- **Issue**: Mixing `string` and `number` types for user IDs
- **Files affected**: `customAuth.ts`, `auth.ts`, `users.ts`, `userService.ts`

### Property Name Mismatches:
- **Issue**: camelCase vs snake_case property names
- **Examples**: `firstName` vs `first_name`, `lastName` vs `last_name`, `isActive` vs `is_active`
- **Files affected**: `auth.ts`, `userService.ts`

## 4. MISSING METHODS

### QuickBooksTokenManager:
- **Missing methods**: `getValidToken()`, `getTokenInfo()`
- **Files affected**: `debug.ts`

## 5. SCHEMA DEFINITION ISSUES

### Database Schema Files:
- **Issue**: Schema definitions don't match actual database structure
- **Files affected**: All schema files in `src/db/`

## REQUIRED FIXES

### 1. Database Schema Updates (CRITICAL)
```sql
-- Add missing columns to existing tables
ALTER TABLE "quickbooks"."tokens" 
ADD COLUMN IF NOT EXISTS "token_type" text DEFAULT 'Bearer',
ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "password_hash" text,
ADD COLUMN IF NOT EXISTS "last_login" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "last_updated" timestamp with time zone DEFAULT now();

ALTER TABLE "google"."calendar_events" 
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "assigned_by" integer,
ADD COLUMN IF NOT EXISTS "entity_id" varchar(100);

ALTER TABLE "google"."time_entries" 
ADD COLUMN IF NOT EXISTS "clock_in" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "clock_out" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "approved" boolean DEFAULT false;

ALTER TABLE "quickbooks"."items" 
ADD COLUMN IF NOT EXISTS "sku" text;

ALTER TABLE "google"."work_assignments" 
ADD COLUMN IF NOT EXISTS "assigned_by" integer,
ADD COLUMN IF NOT EXISTS "entity_id" varchar(100);
```

### 2. TypeScript Code Fixes

#### A. Replace UserServiceSimple References:
```typescript
// Replace all instances of:
UserServiceSimple.authenticateUser()
UserServiceSimple.generateToken()
UserServiceSimple.verifyToken()

// With:
UserService.authenticateUser()
UserService.generateToken()
UserService.verifyToken()
```

#### B. Fix Property Name Mismatches:
```typescript
// Replace camelCase with snake_case:
user.firstName → user.first_name
user.lastName → user.last_name
user.isActive → user.is_active
user.lastLogin → user.last_login
user.passwordHash → user.password_hash
```

#### C. Fix User ID Type Consistency:
```typescript
// Ensure all user IDs are strings (UUIDs):
const userId: string = req.params.id;
// Not: const userId: number = parseInt(req.params.id);
```

#### D. Fix Database Column References:
```typescript
// Use correct column names in database operations:
.set({ last_login: new Date() })  // Not: lastLogin
.set({ last_updated: new Date() }) // Not: lastUpdated
```

### 3. Schema File Updates

#### Update `src/db/schema.ts`:
- Add missing columns to all table definitions
- Ensure column types match database schema
- Fix foreign key relationships

#### Update `src/db/user-schema.ts`:
- Add missing columns: `password_hash`, `last_login`, `last_updated`
- Fix property name consistency

#### Update `src/db/calendar-schema.ts`:
- Add missing columns: `description`, `assigned_by`, `entity_id`
- Fix time entries schema

## PRIORITY ORDER

### 1. CRITICAL (Database Schema)
- Add missing database columns
- Verify schema matches TypeScript definitions

### 2. HIGH (Service References)
- Replace `UserServiceSimple` with `UserService`
- Fix missing method implementations

### 3. MEDIUM (Type Consistency)
- Fix user ID type mismatches
- Fix property name mismatches

### 4. LOW (Code Quality)
- Clean up unused imports
- Fix minor type issues

## ESTIMATED EFFORT

- **Database Schema Updates**: 30 minutes
- **TypeScript Code Fixes**: 2-3 hours
- **Testing and Verification**: 1 hour
- **Total**: 4-5 hours

## NEXT STEPS

1. **Apply database schema changes** (using the SQL provided above)
2. **Update TypeScript schema files** to match database
3. **Fix service references** and method calls
4. **Fix property name mismatches** throughout codebase
5. **Test build** and verify all errors are resolved
6. **Run integration tests** to ensure functionality

## FILES REQUIRING UPDATES

### High Priority:
- `src/db/schema.ts`
- `src/db/user-schema.ts`
- `src/db/calendar-schema.ts`
- `src/services/userService.ts`
- `src/middleware/customAuth.ts`
- `src/routes/auth.ts`

### Medium Priority:
- `src/routes/calendar.ts`
- `src/routes/users.ts`
- `src/services/googleCalendar.ts`
- `src/services/upserts.ts`

### Low Priority:
- `src/routes/debug.ts`
- `src/routes/qbo-oauth.ts`
- `src/services/tokenInitializer.ts`
- `src/services/tokenRefresher.ts`
- `src/services/qboClient.ts`
- `src/services/qboTokenManager.ts`

---

**CONCLUSION**: The main issue is a mismatch between the database schema and the TypeScript schema definitions. Once the database columns are added and the TypeScript schemas are updated, most errors should resolve automatically.
