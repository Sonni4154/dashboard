-- =============================================================================
-- SCHEMA FIXES FOR MARIN PEST CONTROL DASHBOARD
-- =============================================================================
-- This script adds missing columns to fix TypeScript compilation errors
-- Run this in Supabase SQL Editor, then re-export schema.sql

-- =============================================================================
-- 1. CALENDAR EVENTS TABLE - Add Missing Columns
-- =============================================================================
-- Fixes: googleCalendar.ts errors (description field not recognized)

ALTER TABLE google.calendar_events 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_by ON google.calendar_events(assigned_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity_id ON google.calendar_events(entity_id);

-- =============================================================================
-- 2. WORK ASSIGNMENTS TABLE - Add Missing Columns  
-- =============================================================================
-- Fixes: calendar.ts errors (assigned_by not in work_assignments)

ALTER TABLE google.work_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_work_assignments_assigned_by ON google.work_assignments(assigned_by);

-- =============================================================================
-- 3. TIME ENTRIES TABLE - Add Missing Columns
-- =============================================================================
-- Fixes: calendar.ts errors (clock_in, clock_out, approved not in time_entries)

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
-- Fixes: calendar.ts errors (entity_id not in internal_notes)

ALTER TABLE google.internal_notes 
ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_internal_notes_entity_id ON google.internal_notes(entity_id);

-- =============================================================================
-- 5. USER PERMISSIONS TABLE - Fix Column Names
-- =============================================================================
-- Fixes: userService.ts errors (granted_by vs granted_by_user_id mismatch)

-- First check if the column exists with the wrong name
DO $$
BEGIN
    -- Check if granted_by exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'user_permissions' 
               AND column_name = 'granted_by') THEN
        ALTER TABLE public.user_permissions RENAME COLUMN granted_by TO granted_by_user_id;
    END IF;
END $$;

-- =============================================================================
-- 6. AUTH SESSIONS TABLE - Ensure Correct Column Names
-- =============================================================================
-- Fixes: userService.ts errors (column name mismatches)

-- Verify and fix column names if needed
DO $$
BEGIN
    -- Check if session_token column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'auth_sessions' 
                   AND column_name = 'session_token') THEN
        ALTER TABLE public.auth_sessions ADD COLUMN session_token TEXT;
    END IF;
    
    -- Check if expires_at column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'auth_sessions' 
                   AND column_name = 'expires_at') THEN
        ALTER TABLE public.auth_sessions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =============================================================================
-- 7. QUICKBOOKS ITEMS TABLE - Ensure SKU Column
-- =============================================================================
-- Fixes: upserts.ts errors (sku not recognized in items upsert)

-- Verify SKU column exists in quickbooks.items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'quickbooks' 
                   AND table_name = 'items' 
                   AND column_name = 'sku') THEN
        ALTER TABLE quickbooks.items ADD COLUMN sku TEXT;
    END IF;
END $$;

-- Add index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_items_sku ON quickbooks.items(sku);

-- =============================================================================
-- 8. QUICKBOOKS TOKENS TABLE - Verify All Columns Exist
-- =============================================================================
-- Fixes: Multiple token-related errors (token_type, expires_at, is_active)

-- Verify all required columns exist in quickbooks.tokens
DO $$
BEGIN
    -- Check and add token_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'quickbooks' 
                   AND table_name = 'tokens' 
                   AND column_name = 'token_type') THEN
        ALTER TABLE quickbooks.tokens ADD COLUMN token_type TEXT;
    END IF;
    
    -- Check and add expires_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'quickbooks' 
                   AND table_name = 'tokens' 
                   AND column_name = 'expires_at') THEN
        ALTER TABLE quickbooks.tokens ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Check and add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'quickbooks' 
                   AND table_name = 'tokens' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE quickbooks.tokens ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- =============================================================================
-- 9. USERS TABLE - Add Missing Columns
-- =============================================================================
-- Fixes: userService.ts errors (password_hash, last_login, last_updated)

-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- =============================================================================
-- 10. VERIFICATION - Check All Changes Applied
-- =============================================================================
-- This query will show you all the columns that were added/modified

SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema IN ('public', 'quickbooks', 'google')
AND table_name IN ('users', 'auth_sessions', 'user_permissions', 'tokens', 'items', 'calendar_events', 'work_assignments', 'time_entries', 'internal_notes')
AND column_name IN (
    'description', 'assigned_by', 'entity_id', 'clock_in', 'clock_out', 'approved',
    'granted_by_user_id', 'session_token', 'expires_at', 'sku', 'token_type', 'is_active',
    'password_hash', 'last_login', 'last_updated'
)
ORDER BY table_schema, table_name, column_name;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
-- After running this script:
-- 1. Re-export your schema.sql from Supabase
-- 2. Run 'npm run build' to check remaining TypeScript errors
-- 3. Expected: ~35 errors should be fixed, leaving ~8 minor code fixes
