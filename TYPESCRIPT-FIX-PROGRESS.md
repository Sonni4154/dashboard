# TypeScript Error Fix Progress

## Summary
Reduced TypeScript compilation errors from **61 to 43** by fixing:
- `customAuth.ts` - Fixed user interface and replaced `UserServiceSimple` with `UserService`
- `auth.ts` - Fixed column name mismatches (`firstName` → `first_name`, etc.) and removed `UserServiceSimple` references

## Remaining Errors (43 total)

### Category 1: User ID Type Mismatches (5 errors)
Files affected:
- `routes/auth.ts` (2): Line 37, 143 - `createSession` expecting `number` but receiving `string`
- `routes/users.ts` (1): Line 278 - `changePassword` expecting `number` but receiving `string` 
- `services/userService.ts` (2): Lines 265, 286 - Type mismatches in `getUserById` and `eq` operations

**Root Cause**: User IDs are UUIDs (strings) in the database but some functions expect numbers.

### Category 2: Schema Column Mismatches - Tokens Table (6 errors)
Files affected:
- `routes/qbo-oauth.ts` (1): Line 125 - `token_type` not recognized in insert
- `services/tokenInitializer.ts` (1): Line 41 - `token_type` not recognized in insert
- `services/tokenRefresher.ts` (1): Line 99 - `token_type` not recognized in update
- `services/qboClient.ts` (1): Line 179 - `expires_at` not recognized in update
- `services/qboTokenManager.ts` (2): Lines 191, 230 - `expires_at` and `is_active` not recognized

**Root Cause**: Drizzle ORM type inference issue - columns exist in schema but not recognized in insert/update operations.

### Category 3: Schema Column Mismatches - Calendar/Time Entries (7 errors)
Files affected:
- `routes/calendar.ts` (5): Lines 134, 544, 693, 759, 973 - Missing columns in inserts/updates
  - `assigned_by` not in work_assignments
  - `entity_id` not in internal_notes
  - `clock_in`, `clock_out`, `approved` not in time_entries

**Root Cause**: Calendar schema definitions don't match actual Supabase schema.

### Category 4: Schema Column Mismatches - Google Calendar (2 errors)
Files affected:
- `services/googleCalendar.ts` (2): Lines 141, 164 - `description` field not recognized

**Root Cause**: Calendar events schema missing `description` column.

### Category 5: Schema Column Mismatches - Items (1 error)
Files affected:
- `services/upserts.ts` (1): Line 51 - `sku` not recognized in items upsert

**Root Cause**: Items schema may not properly expose `sku` column for updates.

### Category 6: User Service Column Mismatches (10 errors)
Files affected:
- `services/userService.ts` (10): Lines 45, 90, 114, 138, 165, 171, 172, 186, 187, 217, 231, 283, 307, 331, 375, 390
  - `password_hash`, `last_login`, `last_updated` not recognized
  - `userSessions` table not found (should be `authSessions`)
  - `userId` vs `user_id` column name mismatch
  - `role` property doesn't exist (should use `is_admin`)
  - JWT expiresIn type mismatch

**Root Cause**: Multiple column name mismatches and incorrect table references.

### Category 7: Debug Route Issues (5 errors)
Files affected:
- `routes/debug.ts` (5): Lines 136, 175, 176, 234, 236
  - Type assertion issues
  - Missing methods: `getValidToken`, `getTokenInfo`
  - Missing property: `disk_usage`

**Root Cause**: Missing methods in `QuickBooksTokenManager` and type definition issues.

### Category 8: Permission Schema Issues (2 errors)
Files affected:
- `services/userService.ts` (2): Lines 331, 390
  - `granted_by` not recognized in `userPermissions` insert
  - `userId` vs `user_id` column name mismatch

**Root Cause**: Column name mismatches in auth-schema.

## Fix Strategy

### Phase 1: Fix User ID Type Mismatches ✅
Update `UserService.createSession` and `changePassword` to accept `string` instead of `number`.

### Phase 2: Fix Drizzle Schema Type Issues
The tokens table schema is correct but Drizzle isn't inferring types properly. Need to:
1. Check if schema needs to be re-exported from db/index.ts
2. Verify Drizzle version compatibility
3. Consider using explicit type assertions for insert/update operations

### Phase 3: Fix Calendar Schema
Update `calendar-schema.ts` to match Supabase schema:
- Add `assigned_by` to `work_assignments`
- Add `entity_id` to `internal_notes`
- Ensure `time_entries` has `clock_in`, `clock_out`, `approved` columns
- Add `description` to `calendar_events`

### Phase 4: Fix User Service
Update `userService.ts`:
- Replace `userSessions` with `authSessions`
- Fix all column name mismatches
- Remove `role` property checks (use `is_admin`)
- Fix JWT type issues

### Phase 5: Fix Debug Routes
Add missing methods to `QuickBooksTokenManager` or update debug routes to use existing methods.

## Current Status
- ✅ Fixed 18 errors (30% reduction)
- 🔄 43 errors remaining
- 📋 Clear fix strategy identified
- ⏱️ Estimated time: 2-3 hours for complete fix

## Next Steps
1. Fix User ID type mismatches in UserService
2. Update calendar-schema.ts with missing columns
3. Fix userService.ts column name mismatches
4. Add proper type assertions for Drizzle operations
5. Test build after each phase

