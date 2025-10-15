# 🔧 SQL Commands to Fix Schema Errors

## **1. Fix QuickBooks Tokens Table**

```sql
-- Add missing columns to quickbooks.tokens table
ALTER TABLE quickbooks.tokens 
ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'Bearer',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to have default values
UPDATE quickbooks.tokens 
SET token_type = 'Bearer' 
WHERE token_type IS NULL;

UPDATE quickbooks.tokens 
SET is_active = true 
WHERE is_active IS NULL;
```

## **2. Fix Public Users Table**

```sql
-- Add missing columns to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index on role for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
```

## **3. Fix Calendar Events Table**

```sql
-- Add missing columns to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES employees(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_by ON calendar_events(assigned_by);
```

## **4. Fix Work Assignments Table**

```sql
-- Add missing columns to work_assignments table
ALTER TABLE work_assignments 
ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS clock_in TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clock_out TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_assignments_entity_id ON work_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_clock_in ON work_assignments(clock_in);
```

## **5. Fix Time Entries Table**

```sql
-- Add missing columns to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS clock_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS clock_out TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_out ON time_entries(clock_out);
```

## **6. Fix Internal Notes Table**

```sql
-- Add missing columns to internal_notes table
ALTER TABLE internal_notes 
ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_internal_notes_entity_id ON internal_notes(entity_id);
```

## **7. Fix Items Table (QuickBooks)**

```sql
-- Add missing columns to quickbooks.items table
ALTER TABLE quickbooks.items 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_items_sku ON quickbooks.items(sku);
```

## **8. Fix Line Items Tables**

```sql
-- Ensure line items tables have proper structure
-- Invoice line items
ALTER TABLE quickbooks.invoices_line_items 
ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;

-- Estimate line items  
ALTER TABLE quickbooks.estimates_line_items 
ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
```

## **9. Fix User Permissions Table**

```sql
-- Add missing columns to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS permission TEXT NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
```

## **10. Update RLS Policies**

```sql
-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Recreate policies with updated column references
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);
```

## **11. Verify Schema Fixes**

```sql
-- Check if all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'quickbooks' 
AND table_name = 'tokens'
ORDER BY ordinal_position;

-- Check public.users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check calendar_events table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;
```

## **12. Test Schema Fixes**

```sql
-- Test inserting into tokens table
INSERT INTO quickbooks.tokens (
    realm_id, access_token, refresh_token, token_type, 
    expires_at, is_active
) VALUES (
    'test-realm', 'test-access', 'test-refresh', 'Bearer',
    NOW() + INTERVAL '1 hour', true
);

-- Test inserting into users table
INSERT INTO public.users (
    id, email, first_name, last_name, role, username
) VALUES (
    gen_random_uuid(), 'test@example.com', 'Test', 'User', 'employee', 'testuser'
);

-- Clean up test data
DELETE FROM quickbooks.tokens WHERE realm_id = 'test-realm';
DELETE FROM public.users WHERE email = 'test@example.com';
```

---

**Apply these SQL commands in Supabase Studio SQL Editor to fix all schema mismatches!** 🚀
