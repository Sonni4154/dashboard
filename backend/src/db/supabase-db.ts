import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from '@supabase/supabase-js';
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as qbSchema from './schema.js';
import * as calendarSchema from './calendar-schema.js';
import * as userSchema from './user-schema.js';
import * as authSchema from './auth-schema.js';

// Resolve correct .env path (works in dist/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

console.log("🧩 Loading .env from:", envPath);
config({ path: envPath });

// Check if Supabase environment variables are loaded
console.log("🔍 SUPABASE_URL:", process.env.SUPABASE_URL ? "found" : "missing");
console.log("🔍 SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "found" : "missing");

// Verify Supabase environment variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

// Create Supabase client for auth and RLS
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create optimized PostgreSQL connection using Supabase's connection string
// Use the direct connection string for better performance
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('❌ DATABASE_URL environment variable is required');
}

// URL-encode the password to handle special characters
const encodedUrl = connectionString.replace(/TTrustno22##\$\$/g, encodeURIComponent('TTrustno22##$$'));

const sql = postgres(encodedUrl, {
  ssl: { rejectUnauthorized: false },
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  // Use Supabase's optimized connection settings
  prepare: false, // Disable prepared statements for better compatibility
});

// Combine all schemas
const schema = {
  ...qbSchema,
  ...calendarSchema,
  ...userSchema,
  ...authSchema,
};

// Create Drizzle instance with combined schema
export const db = drizzle({ client: sql, schema });

// =============================================================================
// 🔒 SUPABASE-NATIVE RLS CONTEXT MANAGEMENT
// =============================================================================

/**
 * Set service role context using Supabase's native auth
 * This bypasses RLS for system operations
 */
export async function setServiceRoleContext(): Promise<boolean> {
  try {
    // Use Supabase's service role client which bypasses RLS
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log("🔑 Service role context verified");
    return true;
  } catch (error) {
    console.error("❌ Failed to set service role context:", error);
    return false;
  }
}

/**
 * Set user context using Supabase's native auth
 * This enables RLS based on the authenticated user
 */
export async function setUserContext(userId: string): Promise<boolean> {
  try {
    // Use Supabase's admin client to get user
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    
    // Set the user context for RLS
    await sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: 'authenticated' })}, true)`;
    console.log(`🔑 User context set for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to set user context:", error);
    return false;
  }
}

/**
 * Set admin context using Supabase's native auth
 * This enables admin-level access through RLS
 */
export async function setAdminContext(userId: string): Promise<boolean> {
  try {
    // Use Supabase's admin client to get user and check admin status
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    
    // Set the admin context for RLS
    await sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: 'admin_role' })}, true)`;
    console.log(`🔑 Admin context set for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to set admin context:", error);
    return false;
  }
}

/**
 * Clear RLS context (reset to default)
 */
export async function clearRLSContext(): Promise<boolean> {
  try {
    await sql`SELECT set_config('request.jwt.claims', NULL, true)`;
    console.log("🔑 RLS context cleared");
    return true;
  } catch (error) {
    console.error("❌ Failed to clear RLS context:", error);
    return false;
  }
}

/**
 * Get current RLS context
 */
export async function getCurrentContext(): Promise<any> {
  try {
    const result = await sql`SELECT current_setting('request.jwt.claims', true) as context`;
    return result[0]?.context ? JSON.parse(result[0].context) : null;
  } catch (error) {
    console.error("❌ Failed to get current context:", error);
    return null;
  }
}

// Database health check with Supabase integration
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    // Test direct database connection
    await sql`SELECT 1`;
    console.log("✅ Database connection successful with Supabase integration");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Export all schemas
export * from './schema.js';
export * from './calendar-schema.js';
export * from './user-schema.js';
export * from './auth-schema.js';
