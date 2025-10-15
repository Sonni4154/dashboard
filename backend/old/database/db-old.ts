import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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

// Check if DATABASE_URL is loaded
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL ? "found" : "missing");

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL environment variable is required');
}

// Create Supabase PostgreSQL connection with RLS support
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
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
// 🔒 RLS CONTEXT MANAGEMENT
// =============================================================================

/**
 * Set service role context for backend operations
 * This bypasses RLS for system operations
 */
export async function setServiceRoleContext(): Promise<boolean> {
  try {
    await sql`SELECT set_config('request.jwt.claims', '{"role": "service_role"}', true)`;
    console.log("🔑 Service role context set");
    return true;
  } catch (error) {
    console.error("❌ Failed to set service role context:", error);
    return false;
  }
}

/**
 * Set user context for authenticated operations
 * This enables RLS based on the authenticated user
 */
export async function setUserContext(userId: string): Promise<boolean> {
  try {
    await sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: 'authenticated' })}, true)`;
    console.log(`🔑 User context set for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to set user context:", error);
    return false;
  }
}

/**
 * Set admin context for administrative operations
 * This enables admin-level access through RLS
 */
export async function setAdminContext(userId: string): Promise<boolean> {
  try {
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

// Database health check with RLS
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Set service role context for health check
    await setServiceRoleContext();
    await sql`SELECT 1`;
    console.log("✅ Database connection successful with RLS");
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

