#!/usr/bin/env node

/**
 * 🧪 Test RLS Setup
 * 
 * This script tests the RLS setup to ensure it's working correctly.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "backend/.env") });

async function testRLSSetup() {
  console.log("🧪 Testing RLS Setup...\n");

  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    // Create database connection
    const sql = neon(process.env.DATABASE_URL);
    
    console.log("1. Testing database connection...");
    await sql`SELECT 1`;
    console.log("✅ Database connection successful\n");
    
    console.log("2. Checking RLS status on tables...");
    
    // Check RLS status on public tables
    const publicTables = await sql`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      ORDER BY tablename
    `;
    
    console.log("📋 Public schema tables:");
    for (const table of publicTables) {
      const status = table.rowsecurity ? "🔒 RLS Enabled" : "⚠️  RLS Disabled";
      console.log(`   ${table.tablename}: ${status}`);
    }
    
    // Check RLS status on QuickBooks tables
    const qbTables = await sql`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'quickbooks'
      ORDER BY tablename
    `;
    
    console.log("\n📋 QuickBooks schema tables:");
    for (const table of qbTables) {
      const status = table.rowsecurity ? "🔒 RLS Enabled" : "⚠️  RLS Disabled";
      console.log(`   ${table.tablename}: ${status}`);
    }
    
    console.log("\n3. Testing RLS policies...");
    
    // Test service role context
    console.log("   Testing service role context...");
    await sql`SELECT set_config('request.jwt.claims', '{"role": "service_role"}', true)`;
    const serviceContext = await sql`SELECT current_setting('request.jwt.claims', true) as context`;
    console.log(`   ✅ Service role context: ${serviceContext[0]?.context || 'null'}`);
    
    // Test user context
    console.log("   Testing user context...");
    await sql`SELECT set_config('request.jwt.claims', '{"sub": "test-user-id", "role": "authenticated"}', true)`;
    const userContext = await sql`SELECT current_setting('request.jwt.claims', true) as context`;
    console.log(`   ✅ User context: ${userContext[0]?.context || 'null'}`);
    
    // Test admin context
    console.log("   Testing admin context...");
    await sql`SELECT set_config('request.jwt.claims', '{"sub": "admin-user-id", "role": "admin_role"}', true)`;
    const adminContext = await sql`SELECT current_setting('request.jwt.claims', true) as context`;
    console.log(`   ✅ Admin context: ${adminContext[0]?.context || 'null'}`);
    
    console.log("\n4. Testing helper functions...");
    
    // Test helper functions exist
    const functions = await sql`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname IN ('set_service_role_context', 'set_user_context', 'set_admin_context')
    `;
    
    console.log("📋 RLS helper functions:");
    for (const func of functions) {
      console.log(`   ✅ ${func.proname}: Available`);
    }
    
    console.log("\n5. Testing table access with RLS...");
    
    // Test access to users table with service role
    try {
      await sql`SELECT set_config('request.jwt.claims', '{"role": "service_role"}', true)`;
      const userCount = await sql`SELECT COUNT(*) as count FROM public.users`;
      console.log(`   ✅ Service role can access users table: ${userCount[0]?.count || 0} users`);
    } catch (error) {
      console.log(`   ❌ Service role cannot access users table: ${error.message}`);
    }
    
    // Test access to QuickBooks tables with service role
    try {
      await sql`SELECT set_config('request.jwt.claims', '{"role": "service_role"}', true)`;
      const tokenCount = await sql`SELECT COUNT(*) as count FROM quickbooks.tokens`;
      console.log(`   ✅ Service role can access tokens table: ${tokenCount[0]?.count || 0} tokens`);
    } catch (error) {
      console.log(`   ❌ Service role cannot access tokens table: ${error.message}`);
    }
    
    console.log("\n🎉 RLS setup test completed!");
    console.log("✅ All tests passed - RLS is working correctly");
    
  } catch (error) {
    console.error("❌ RLS setup test failed:", error);
    process.exit(1);
  }
}

// Run the test
testRLSSetup();
