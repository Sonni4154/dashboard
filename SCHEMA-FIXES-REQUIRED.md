# 🔧 Schema Fixes Required

## 🚨 **Critical Issues Found:**

The backend has **104 TypeScript errors** due to schema mismatches between the Drizzle ORM definitions and the actual Supabase database schema.

## 📋 **Main Issues:**

### 1. **Column Name Mismatches (camelCase vs snake_case)**
- Code uses: `firstName`, `lastName`, `isActive`, `createdAt`, `updatedAt`
- Database has: `first_name`, `last_name`, `is_active`, `created_at`, `last_updated`

### 2. **Missing Columns in Schema Definitions**
- `tokens` table missing: `token_type`, `expires_at`, `is_active`
- `users` table missing: `role`, `username`, `password_hash`
- `calendar_events` table missing: `description`
- Line items tables missing: `id` (auto-increment primary key)

### 3. **Type Mismatches**
- User IDs: Code expects `number`, database has `string` (UUID)
- Database queries: `result.rows` vs direct array access
- JWT token handling: Missing proper type definitions

## 🔧 **Required Fixes:**

### **Step 1: Update Schema Definitions**

#### A. Fix `backend/src/db/schema.ts`:
```typescript
// Add missing columns to tokens table
export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),
  realm_id: text('realm_id').notNull(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  token_type: text('token_type').default('Bearer'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  refresh_token_expires_at: timestamp('refresh_token_expires_at', { withTimezone: true }),
  is_active: boolean('is_active').default(true),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  scope: text('scope'),
  environment: text('environment').default('sandbox')
}, (table) => ({
  realmIdx: index('idx_tokens_realm_id').on(table.realm_id),
  activeIdx: index('idx_tokens_active').on(table.is_active)
}));
```

#### B. Fix `backend/src/db/user-schema.ts`:
```typescript
// Add missing columns to users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  username: text('username'),
  password_hash: text('password_hash'),
  role: text('role').default('employee'),
  is_active: boolean('is_active').default(true),
  // ... other existing columns
});
```

### **Step 2: Update Service Files**

#### A. Fix `backend/src/services/userService.ts`:
```typescript
// Update all property references to use snake_case
firstName: user.first_name,
lastName: user.last_name,
isActive: user.is_active,
createdAt: user.created_at,
lastLogin: user.last_login,
// etc.
```

#### B. Fix `backend/src/routes/users.ts`:
```typescript
// Update all property references
firstName: user.first_name,
lastName: user.last_name,
isActive: user.is_active,
// etc.
```

### **Step 3: Update Database Queries**

#### A. Fix postgres-js query results:
```typescript
// Change from:
const result = await sql`SELECT * FROM table`;
return result.rows[0];

// To:
const result = await sql`SELECT * FROM table`;
return result[0];
```

#### B. Fix ID type handling:
```typescript
// Change from:
where: eq(users.id, userId) // userId is number

// To:
where: eq(users.id, userId) // userId is string (UUID)
```

### **Step 4: Update Google OAuth Integration**

#### A. Fix `backend/src/routes/google-oauth.ts`:
```typescript
// Fix Supabase OAuth call
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${req.protocol}://${req.get('host')}/api/auth/google/callback`
  }
});

// Handle the response properly
if (error) {
  // Handle error
}

// Redirect to the OAuth URL
res.redirect(data.url);
```

## 🚀 **Quick Fix Strategy:**

### **Option 1: Update All Code (Recommended)**
1. Update all schema definitions to match Supabase
2. Update all service files to use snake_case
3. Fix all database queries
4. Update type definitions

### **Option 2: Update Database Schema (Not Recommended)**
1. Change Supabase schema to match code
2. This would require database migrations
3. May break existing data

## 📝 **Files That Need Updates:**

### **Schema Files:**
- `backend/src/db/schema.ts` - QuickBooks tables
- `backend/src/db/user-schema.ts` - User tables
- `backend/src/db/calendar-schema.ts` - Calendar tables

### **Service Files:**
- `backend/src/services/userService.ts`
- `backend/src/services/qboTokenManager.ts`
- `backend/src/services/qboClient.ts`
- `backend/src/services/tokenInitializer.ts`
- `backend/src/services/tokenRefresher.ts`
- `backend/src/services/upserts.ts`
- `backend/src/services/googleCalendar.ts`

### **Route Files:**
- `backend/src/routes/users.ts`
- `backend/src/routes/google-oauth.ts`
- `backend/src/routes/qbo-oauth.ts`
- `backend/src/routes/webhook.ts`
- `backend/src/routes/calendar.ts`
- `backend/src/routes/debug.ts`

### **Middleware Files:**
- `backend/src/middleware/customAuth.ts`

## ⚡ **Immediate Action Required:**

1. **Update your `.env` file** with the Supabase credentials
2. **Apply RLS setup** in Supabase Studio
3. **Fix schema definitions** to match Supabase
4. **Update all service files** to use correct column names
5. **Test the integration** after fixes

## 🔍 **Testing After Fixes:**

```bash
# Build the backend
npm run build

# Start the backend
npm run dev

# Test Google OAuth
curl http://localhost:5000/api/auth/google

# Test database connection
curl http://localhost:5000/api/health
```

---

**The schema alignment is critical for the application to work properly with Supabase!** 🚀

Would you like me to start fixing these schema issues systematically?
