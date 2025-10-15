# 🔒 Row Level Security (RLS) Setup Guide

## 📋 Overview

This guide will help you enable Row Level Security (RLS) on your Supabase database for the Marin Pest Control Dashboard. RLS provides fine-grained access control at the database level.

## 🚀 Quick Setup (Recommended)

### Option 1: Supabase Studio (Easiest)

1. **Go to Supabase Studio**: https://supabase.com/dashboard
2. **Select your project**: `jpzhrnuchnfmagcjlorc`
3. **Navigate to SQL Editor**
4. **Copy and paste the RLS setup SQL** (see below)
5. **Click "Run"**

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref jpzhrnuchnfmagcjlorc

# Run the RLS setup
supabase db reset --db-url "postgresql://postgres:TTrustno22##$$@db.jpzhrnuchnfmagcjlorc.supabase.co:5432/postgres"
```

## 🔧 Manual RLS Setup

### Step 1: Enable RLS on Tables

Run this SQL in Supabase Studio:

```sql
-- Enable RLS on public schema tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."auth_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."auth_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."auth_verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."time_clock_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."kv_store_d9b518ae" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on QuickBooks schema tables
ALTER TABLE "quickbooks"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."estimates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."estimates_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."invoices_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."sync_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."token_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quickbooks"."webhook_events" ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create RLS Policies

```sql
-- Users table policies
CREATE POLICY "Users can view own profile" ON "public"."users"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "public"."users"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role full access to users" ON "public"."users"
    FOR ALL USING (auth.role() = 'service_role');

-- Auth sessions policies
CREATE POLICY "Users can view own sessions" ON "public"."auth_sessions"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to sessions" ON "public"."auth_sessions"
    FOR ALL USING (auth.role() = 'service_role');

-- Time clock entries policies
CREATE POLICY "Users can view own time entries" ON "public"."time_clock_entries"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to time entries" ON "public"."time_clock_entries"
    FOR ALL USING (auth.role() = 'service_role');

-- QuickBooks data policies
CREATE POLICY "Service role full access to QB data" ON "quickbooks"."customers"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read QB customers" ON "quickbooks"."customers"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Repeat for other QuickBooks tables...
```

### Step 3: Create Helper Functions

```sql
-- Function to set service role context
CREATE OR REPLACE FUNCTION set_service_role_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', '{"role": "service_role"}', true);
END;
$$;

-- Function to set user context
CREATE OR REPLACE FUNCTION set_user_context(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
END;
$$;
```

## 🧪 Testing RLS Setup

### Test 1: Verify RLS is Enabled

```sql
-- Check RLS status on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('public', 'quickbooks')
AND tablename NOT LIKE 'pg_%'
ORDER BY schemaname, tablename;
```

### Test 2: Test Service Role Context

```sql
-- Test service role context
SELECT set_config('request.jwt.claims', '{"role": "service_role"}', true);
SELECT current_setting('request.jwt.claims', true) as context;
```

### Test 3: Test User Context

```sql
-- Test user context
SELECT set_config('request.jwt.claims', '{"sub": "test-user-id", "role": "authenticated"}', true);
SELECT current_setting('request.jwt.claims', true) as context;
```

## 🔧 Backend Integration

The backend has been updated to handle RLS context:

### 1. Database Connection (`backend/src/db/db.ts`)

- Added RLS context management functions
- Service role context for backend operations
- User context for authenticated operations

### 2. RLS Service (`backend/src/services/rlsService.ts`)

- `RLSService.withServiceRole()` - For system operations
- `RLSService.withUserContext()` - For user operations
- `RLSService.withAdminContext()` - For admin operations

### 3. Updated Services

- QuickBooks token manager uses service role context
- All database operations now respect RLS policies

## 🚨 Important Notes

1. **Service Role**: Backend operations use service role to bypass RLS
2. **User Context**: Frontend operations use authenticated user context
3. **Admin Context**: Administrative operations use admin role context
4. **Testing**: Always test with different user contexts

## 🔍 Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure DATABASE_URL is correct
2. **Permission Denied**: Check RLS policies are correct
3. **Context Not Set**: Verify RLS context is set before operations

### Debug Commands

```sql
-- Check current context
SELECT current_setting('request.jwt.claims', true) as context;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Test access
SELECT COUNT(*) FROM public.users;
```

## ✅ Verification Checklist

- [ ] RLS enabled on all tables
- [ ] Policies created for all tables
- [ ] Helper functions created
- [ ] Backend updated to use RLS context
- [ ] Service role context works
- [ ] User context works
- [ ] Admin context works
- [ ] API endpoints work with RLS

## 📞 Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify RLS policies are correct
3. Test with different user contexts
4. Check backend logs for RLS context errors

---

**Next Steps**: After RLS is enabled, test the API endpoints to ensure they work correctly with the new security model.
