# 🔒 USER ROLE SYSTEM FOR MARIN PEST CONTROL DASHBOARD

## **📋 OVERVIEW**

The system uses a multi-layered role-based access control (RBAC) system with Row Level Security (RLS) in Supabase PostgreSQL.

## **🎯 USER ROLES**

### **1. Service Role (`service_role`)**
- **Purpose:** Backend operations that bypass RLS
- **Usage:** Token management, data synchronization, system operations
- **Access:** Full access to all tables
- **Context:** Set automatically for backend operations

### **2. Authenticated Role (`authenticated`)**
- **Purpose:** Default Supabase authenticated users
- **Usage:** Basic authenticated access
- **Access:** Limited to own data and read-only access to business data
- **Context:** Set when user logs in via Google OAuth

### **3. Admin Role (`admin_role`)**
- **Purpose:** Administrative users with elevated permissions
- **Usage:** User management, system configuration, full data access
- **Access:** Full access to all tables and operations
- **Context:** Set when `is_admin = true` in `public.users` table

### **4. Employee Role (`employee_role`)**
- **Purpose:** Regular employees with standard permissions
- **Usage:** Daily operations, time tracking, limited data access
- **Access:** Own data + read access to business data
- **Context:** Set when `is_admin = false` in `public.users` table

## **🔐 RLS POLICIES BY ROLE**

### **Public Schema Tables**

#### **Users Table**
- **Service Role:** Full access (ALL operations)
- **Admin Role:** Can view all users (SELECT)
- **Authenticated:** Can view/update own profile only
- **Employee Role:** Can view/update own profile only

#### **Auth Sessions Table**
- **Service Role:** Full access (ALL operations)
- **Authenticated:** Can view/delete own sessions
- **Admin Role:** No direct access (managed by service role)
- **Employee Role:** Can view/delete own sessions

#### **Time Clock Entries Table**
- **Service Role:** Full access (ALL operations)
- **Admin Role:** Can view all time entries (SELECT)
- **Authenticated:** Can view/create/update own entries
- **Employee Role:** Can view/create/update own entries

### **QuickBooks Schema Tables**

#### **Customers, Items, Invoices, Estimates**
- **Service Role:** Full access (ALL operations)
- **Admin Role:** Full access (ALL operations)
- **Authenticated:** Read-only access (SELECT)
- **Employee Role:** Read-only access (SELECT)

#### **Tokens Table (Most Restrictive)**
- **Service Role:** Full access (ALL operations)
- **Admin Role:** No access (security)
- **Authenticated:** No access (security)
- **Employee Role:** No access (security)

## **🔄 ROLE ASSIGNMENT FLOW**

### **1. Google OAuth Login**
```
User logs in via Google OAuth
    ↓
Supabase creates session with 'authenticated' role
    ↓
Backend checks public.users table for user
    ↓
If user exists:
    - is_admin = true → Set 'admin_role' context
    - is_admin = false → Set 'employee_role' context
    ↓
If user doesn't exist:
    - Use default 'authenticated' role
```

### **2. Role Context Setting**
```typescript
// In middleware/rlsContext.ts
if (existingUser.is_admin) {
  await setAdminContext(user.id);  // Sets 'admin_role'
} else {
  await setUserContext(user.id);   // Sets 'employee_role'
}
```

## **🛠️ IMPLEMENTATION DETAILS**

### **RLS Context Functions**
```sql
-- Set service role context (bypasses RLS)
SELECT set_service_role_context();

-- Set user context (enables RLS for authenticated user)
SELECT set_user_context('user-uuid-here');

-- Set admin context (enables admin-level RLS)
SELECT set_admin_context('user-uuid-here');
```

### **Middleware Integration**
```typescript
// In index.ts
app.use(setRLSContext);  // Must be before routes

// In routes, access user info:
req.user = {
  id: 'user-uuid',
  email: 'user@example.com',
  isAdmin: true,
  role: 'admin_role'
};
```

## **🔍 TROUBLESHOOTING**

### **Common Issues:**

1. **"Permission denied" errors**
   - Check if RLS context is set correctly
   - Verify user exists in `public.users` table
   - Ensure correct role is assigned

2. **"User not found" errors**
   - User may not exist in local database
   - Check Google OAuth callback creates user record
   - Verify `google_id` field matches Supabase user ID

3. **"Insufficient permissions" errors**
   - Check RLS policies match user role
   - Verify middleware is setting correct context
   - Ensure user has required permissions

### **Debug Commands:**
```sql
-- Check current RLS context
SELECT current_setting('request.jwt.claims', true);

-- Check user permissions
SELECT * FROM public.users WHERE google_id = 'user-uuid';

-- Check RLS status on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('public', 'quickbooks');
```

## **📝 NEXT STEPS**

1. **Test Google OAuth Flow** - Verify role assignment works
2. **Test API Endpoints** - Ensure proper access control
3. **Create Admin Users** - Set up initial admin accounts
4. **Test Employee Access** - Verify limited permissions work
5. **Monitor RLS Performance** - Check query performance with RLS enabled

## **🔐 SECURITY NOTES**

- **Tokens table** is most restrictive (service role only)
- **Admin operations** require explicit admin role
- **User data** is isolated by user ID
- **Business data** is read-only for employees
- **Service operations** bypass RLS for system functionality
