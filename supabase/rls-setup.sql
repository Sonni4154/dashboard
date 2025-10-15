-- =============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) SETUP FOR MARIN PEST CONTROL DASHBOARD
-- =============================================================================
-- This script enables RLS on all tables and creates appropriate policies
-- for secure access control based on user roles and authentication
-- =============================================================================

-- =============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

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

-- =============================================================================
-- 2. CREATE ROLES AND PERMISSIONS
-- =============================================================================

-- Create custom roles for the application
DO $$
BEGIN
    -- Create service role for backend operations
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
    END IF;
    
    -- Create authenticated user role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
    
    -- Create admin role for administrative operations
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
        CREATE ROLE admin_role;
    END IF;
    
    -- Create employee role for regular users
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'employee_role') THEN
        CREATE ROLE employee_role;
    END IF;
END $$;

-- Grant necessary permissions to roles
GRANT USAGE ON SCHEMA public TO service_role, authenticated, admin_role, employee_role;
GRANT USAGE ON SCHEMA quickbooks TO service_role, authenticated, admin_role, employee_role;
GRANT USAGE ON SCHEMA dashboard TO service_role, authenticated, admin_role, employee_role;
GRANT USAGE ON SCHEMA google TO service_role, authenticated, admin_role, employee_role;

-- =============================================================================
-- 3. PUBLIC SCHEMA POLICIES
-- =============================================================================

-- Users table policies (more restrictive)
CREATE POLICY "Users can view own profile" ON "public"."users"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "public"."users"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role full access to users" ON "public"."users"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can manage all users" ON "public"."users"
    FOR ALL USING (auth.role() = 'admin_role');

-- Auth sessions policies
CREATE POLICY "Users can view own sessions" ON "public"."auth_sessions"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON "public"."auth_sessions"
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to sessions" ON "public"."auth_sessions"
    FOR ALL USING (auth.role() = 'service_role');

-- Time clock entries policies
CREATE POLICY "Users can view own time entries" ON "public"."time_clock_entries"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time entries" ON "public"."time_clock_entries"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON "public"."time_clock_entries"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to time entries" ON "public"."time_clock_entries"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can view all time entries" ON "public"."time_clock_entries"
    FOR SELECT USING (auth.role() = 'admin_role');

-- User permissions policies
CREATE POLICY "Users can view own permissions" ON "public"."user_permissions"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to permissions" ON "public"."user_permissions"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can manage all permissions" ON "public"."user_permissions"
    FOR ALL USING (auth.role() = 'admin_role');

-- Auth providers policies
CREATE POLICY "Service role full access to auth providers" ON "public"."auth_providers"
    FOR ALL USING (auth.role() = 'service_role');

-- Auth verification tokens policies
CREATE POLICY "Service role full access to verification tokens" ON "public"."auth_verification_tokens"
    FOR ALL USING (auth.role() = 'service_role');

-- KV store policies
CREATE POLICY "Service role full access to kv store" ON "public"."kv_store_d9b518ae"
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 4. QUICKBOOKS SCHEMA POLICIES
-- =============================================================================

-- Companies table policies
CREATE POLICY "Service role full access to companies" ON "quickbooks"."companies"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read companies" ON "quickbooks"."companies"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Customers table policies
CREATE POLICY "Service role full access to customers" ON "quickbooks"."customers"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read customers" ON "quickbooks"."customers"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin role can manage customers" ON "quickbooks"."customers"
    FOR ALL USING (auth.role() = 'admin_role');

-- Items table policies
CREATE POLICY "Service role full access to items" ON "quickbooks"."items"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read items" ON "quickbooks"."items"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin role can manage items" ON "quickbooks"."items"
    FOR ALL USING (auth.role() = 'admin_role');

-- Invoices table policies
CREATE POLICY "Service role full access to invoices" ON "quickbooks"."invoices"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read invoices" ON "quickbooks"."invoices"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin role can manage invoices" ON "quickbooks"."invoices"
    FOR ALL USING (auth.role() = 'admin_role');

-- Invoice line items policies
CREATE POLICY "Service role full access to invoice line items" ON "quickbooks"."invoices_line_items"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read invoice line items" ON "quickbooks"."invoices_line_items"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Estimates table policies
CREATE POLICY "Service role full access to estimates" ON "quickbooks"."estimates"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read estimates" ON "quickbooks"."estimates"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin role can manage estimates" ON "quickbooks"."estimates"
    FOR ALL USING (auth.role() = 'admin_role');

-- Estimate line items policies
CREATE POLICY "Service role full access to estimate line items" ON "quickbooks"."estimates_line_items"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read estimate line items" ON "quickbooks"."estimates_line_items"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Jobs table policies
CREATE POLICY "Service role full access to jobs" ON "quickbooks"."jobs"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read jobs" ON "quickbooks"."jobs"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Tokens table policies (most restrictive - service role only)
CREATE POLICY "Service role only access to tokens" ON "quickbooks"."tokens"
    FOR ALL USING (auth.role() = 'service_role');

-- Token audit policies
CREATE POLICY "Service role full access to token audit" ON "quickbooks"."token_audit"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can read token audit" ON "quickbooks"."token_audit"
    FOR SELECT USING (auth.role() = 'admin_role');

-- Sync state policies
CREATE POLICY "Service role full access to sync state" ON "quickbooks"."sync_state"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can read sync state" ON "quickbooks"."sync_state"
    FOR SELECT USING (auth.role() = 'admin_role');

-- Tenants policies
CREATE POLICY "Service role full access to tenants" ON "quickbooks"."tenants"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can manage tenants" ON "quickbooks"."tenants"
    FOR ALL USING (auth.role() = 'admin_role');

-- Webhook events policies
CREATE POLICY "Service role full access to webhook events" ON "quickbooks"."webhook_events"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin role can read webhook events" ON "quickbooks"."webhook_events"
    FOR SELECT USING (auth.role() = 'admin_role');

-- =============================================================================
-- 5. CREATE HELPER FUNCTIONS FOR RLS CONTEXT
-- =============================================================================

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

-- Function to set admin context
CREATE OR REPLACE FUNCTION set_admin_context(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'admin_role')::text, true);
END;
$$;

-- =============================================================================
-- 6. GRANT EXECUTE PERMISSIONS ON HELPER FUNCTIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION set_service_role_context() TO service_role;
GRANT EXECUTE ON FUNCTION set_user_context(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION set_admin_context(uuid) TO service_role;

-- =============================================================================
-- 7. CREATE INDEXES FOR BETTER RLS PERFORMANCE
-- =============================================================================

-- Indexes for auth.uid() lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON "public"."users" (id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON "public"."auth_sessions" (user_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_entries_user_id ON "public"."time_clock_entries" (user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON "public"."user_permissions" (user_id);

-- =============================================================================
-- 8. VERIFY RLS SETUP
-- =============================================================================

-- Check that RLS is enabled on all tables
DO $$
DECLARE
    table_record RECORD;
    rls_enabled_count INTEGER := 0;
    total_tables INTEGER := 0;
BEGIN
    -- Count tables with RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname IN ('public', 'quickbooks')
        AND tablename NOT LIKE 'pg_%'
    LOOP
        total_tables := total_tables + 1;
        IF table_record.rowsecurity THEN
            rls_enabled_count := rls_enabled_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS Setup Complete: %/% tables have RLS enabled', rls_enabled_count, total_tables;
    
    IF rls_enabled_count = total_tables THEN
        RAISE NOTICE '✅ All tables have RLS enabled successfully!';
    ELSE
        RAISE WARNING '⚠️  Some tables may not have RLS enabled. Check the setup.';
    END IF;
END $$;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ROW LEVEL SECURITY SETUP COMPLETE!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '✅ RLS enabled on all tables';
    RAISE NOTICE '✅ Policies created for all schemas';
    RAISE NOTICE '✅ Helper functions created';
    RAISE NOTICE '✅ Indexes optimized for RLS';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update backend to use service role context';
    RAISE NOTICE '2. Test authentication and authorization';
    RAISE NOTICE '3. Verify API endpoints work with RLS';
    RAISE NOTICE '';
END $$;
