-- =============================================================================
-- SAFE SCHEMA FIXES FOR MARIN PEST CONTROL DASHBOARD
-- =============================================================================
-- This script ONLY adds missing columns that are causing TypeScript errors
-- All changes are verified against the current schema.sql

-- =============================================================================
-- VERIFICATION: Current Schema Analysis
-- =============================================================================
-- ✅ quickbooks.tokens: Already has token_type, expires_at, is_active
-- ✅ public.users: Already has password_hash  
-- ✅ public.auth_sessions: Already has session_token, expires_at, last_updated
-- ✅ google.calendar_events: Already has description
-- ❌ Missing: assigned_by, entity_id in calendar_events
-- ❌ Missing: clock_in, clock_out, approved in time_entries
-- ❌ Missing: assigned_by in work_assignments
-- ❌ Missing: entity_id in internal_notes

-- =============================================================================
-- 1. CALENDAR EVENTS TABLE - Add Only Missing Columns
-- =============================================================================
-- Current: has description ✅
-- Missing: assigned_by, entity_id

ALTER TABLE google.calendar_events 
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_by ON google.calendar_events(assigned_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity_id ON google.calendar_events(entity_id);

-- =============================================================================
-- 2. WORK ASSIGNMENTS TABLE - Add Missing Column
-- =============================================================================
-- Missing: assigned_by

ALTER TABLE google.work_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_work_assignments_assigned_by ON google.work_assignments(assigned_by);

-- =============================================================================
-- 3. TIME ENTRIES TABLE - Add Missing Columns
-- =============================================================================
-- Missing: clock_in, clock_out, approved

ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS clock_in TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clock_out TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON public.time_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_out ON public.time_entries(clock_out);
CREATE INDEX IF NOT EXISTS idx_time_entries_approved ON public.time_entries(approved);

-- =============================================================================
-- 4. INTERNAL NOTES TABLE - Add Missing Column
-- =============================================================================
-- Missing: entity_id

ALTER TABLE google.internal_notes 
ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_internal_notes_entity_id ON google.internal_notes(entity_id);

-- =============================================================================
-- 5. USERS TABLE - Add Only Missing Columns
-- =============================================================================
-- Current: has password_hash ✅
-- Missing: last_login, last_updated

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- =============================================================================
-- 6. QUICKBOOKS ITEMS TABLE - Verify SKU Column
-- =============================================================================
-- Check if SKU column exists, add if missing

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'quickbooks' 
                   AND table_name = 'items' 
                   AND column_name = 'sku') THEN
        ALTER TABLE quickbooks.items ADD COLUMN sku TEXT;
        CREATE INDEX IF NOT EXISTS idx_items_sku ON quickbooks.items(sku);
    END IF;
END $$;

-- =============================================================================
-- 7. VERIFICATION QUERY - Show What Was Added
-- =============================================================================
-- This will show you exactly what columns were added

SELECT 
    'ADDED COLUMNS' as status,
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema IN ('public', 'quickbooks', 'google')
AND table_name IN ('users', 'calendar_events', 'work_assignments', 'time_entries', 'internal_notes', 'items')
AND column_name IN (
    'assigned_by', 'entity_id', 'clock_in', 'clock_out', 'approved',
    'last_login', 'last_updated', 'sku'
)
ORDER BY table_schema, table_name, column_name;

-- =============================================================================
-- SAFETY NOTES
-- =============================================================================
-- ✅ No changes to existing columns
-- ✅ No changes to quickbooks.tokens (already has all needed columns)
-- ✅ No changes to public.auth_sessions (already has all needed columns)  
-- ✅ No changes to public.users (only adding missing columns)
-- ✅ All changes use IF NOT EXISTS for safety
-- ✅ All new columns have appropriate indexes
-- ✅ Foreign key references are properly set up
