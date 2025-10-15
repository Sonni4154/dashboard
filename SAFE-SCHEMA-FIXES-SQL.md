# 🔒 SAFE Schema Fixes - Based on Your Actual Supabase Schema

## ⚠️ **IMPORTANT: These commands are SAFE and only add missing columns**

Based on your actual `supabase/schema.sql`, here are the **SAFE** SQL commands that won't break your existing database:

## **1. QuickBooks Tokens Table - ALREADY CORRECT ✅**
Your `quickbooks.tokens` table already has all the required columns:
- ✅ `token_type` - EXISTS
- ✅ `expires_at` - EXISTS  
- ✅ `is_active` - EXISTS

**No changes needed for tokens table!**

## **2. Public Users Table - ALREADY CORRECT ✅**
Your `public.users` table already has all the required columns:
- ✅ `username` - EXISTS
- ✅ `password_hash` - EXISTS
- ✅ `is_active` - EXISTS

**No changes needed for users table!**

## **3. QuickBooks Line Items - ALREADY CORRECT ✅**
Your line items tables already have the `id` columns:
- ✅ `quickbooks.invoices_line_items.id` - EXISTS (bigint)
- ✅ `quickbooks.estimates_line_items.id` - EXISTS (bigint)

**No changes needed for line items tables!**

## **4. QuickBooks Items Table - ADD MISSING COLUMN**

```sql
-- Add missing sku column to quickbooks.items (if not exists)
ALTER TABLE quickbooks.items 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_items_sku ON quickbooks.items(sku);
```

## **5. Google Calendar Events - CHECK IF EXISTS**

```sql
-- Check if calendar_events table exists in google schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'google' 
AND table_name = 'calendar_events'
ORDER BY ordinal_position;
```

If the `google.calendar_events` table doesn't exist, create it:

```sql
-- Create google.calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS google.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_event_id TEXT NOT NULL UNIQUE,
    google_calendar_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT false,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **6. Work Assignments - CHECK IF EXISTS**

```sql
-- Check if work_assignments table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'google' 
AND table_name = 'work_assignments'
ORDER BY ordinal_position;
```

If the `google.work_assignments` table doesn't exist, create it:

```sql
-- Create google.work_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS google.work_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calendar_event_id UUID NOT NULL REFERENCES google.calendar_events(id),
    employee_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_order INTEGER,
    status TEXT DEFAULT 'assigned',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    employee_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **7. Time Entries - CHECK IF EXISTS**

```sql
-- Check if time_entries table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'time_entries'
ORDER BY ordinal_position;
```

If the `public.time_entries` table doesn't exist, create it:

```sql
-- Create public.time_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clock_out TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    clock_in_location TEXT,
    clock_out_location TEXT,
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **8. Internal Notes - CHECK IF EXISTS**

```sql
-- Check if internal_notes table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'internal_notes'
ORDER BY ordinal_position;
```

If the `public.internal_notes` table doesn't exist, create it:

```sql
-- Create public.internal_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.internal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    title TEXT,
    content TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'normal',
    pinned BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **9. User Permissions - ALREADY EXISTS ✅**
Your `public.user_permissions` table already exists with the correct structure.

## **10. VERIFICATION QUERIES**

Run these queries to verify your current schema:

```sql
-- Check all tables in your database
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname IN ('public', 'quickbooks', 'google', 'dashboard')
ORDER BY schemaname, tablename;

-- Check specific columns that might be missing
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema IN ('public', 'quickbooks', 'google')
AND table_name IN ('tokens', 'users', 'calendar_events', 'work_assignments', 'time_entries', 'internal_notes')
ORDER BY table_schema, table_name, ordinal_position;
```

## **🚨 CRITICAL: Only run the commands for tables that DON'T exist!**

**Your existing tables are already correctly structured!** The TypeScript errors are likely due to:

1. **Column name mismatches** (camelCase vs snake_case) in your code
2. **Missing table references** in your Drizzle schema
3. **Type mismatches** between code and database

**The database schema is correct - the issue is in your TypeScript code!** 🎯
