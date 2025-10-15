import postgres from 'postgres';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, ".env") });

async function addRoleColumn() {
  console.log("🔧 Adding role column to users table...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    const encodedUrl = databaseUrl.replace(/TTrustno22##\$\$/g, encodeURIComponent('TTrustno22##$$'));
    
    console.log("🔗 Connecting to database...");
    const sql = postgres(encodedUrl, {
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5,
    });
    
    const roleColumnSQL = readFileSync(path.resolve(__dirname, "add-role-column.sql"), "utf8");
    
    console.log("📋 Adding role column to users table...");
    await sql.unsafe(roleColumnSQL);
    
    console.log("\n🎉 Role column added successfully!");
    console.log("✅ Column 'role' added to public.users table");
    console.log("✅ Existing admin users updated to 'admin_role'");
    console.log("✅ Existing non-admin users updated to 'employee_role'");
    console.log("✅ Constraint added to ensure valid role values");

    await sql.end();
  } catch (error) {
    console.error("❌ Failed to add role column:", error);
    process.exit(1);
  }
}

addRoleColumn();
