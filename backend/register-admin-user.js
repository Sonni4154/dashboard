import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, ".env") });

async function registerAdminUser() {
  console.log("🔧 Registering admin user in Supabase Database...\n");

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
    
    // User details
    const email = 'spencermreiser@gmail.com';
    const password = 'password123';
    const username = 'spencermreiser@gmail.com';
    
    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log("👤 Creating admin user...");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Username: ${username}`);
    
    // Insert user into public.users table
    const result = await sql`
      INSERT INTO public.users (
        id,
        email,
        username,
        password_hash,
        first_name,
        last_name,
        is_admin,
        is_active,
        role,
        created_at,
        last_updated
      ) VALUES (
        gen_random_uuid(),
        ${email},
        ${username},
        ${passwordHash},
        'Spencer',
        'Reiser',
        true,
        true,
        'admin_role',
        now(),
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        is_admin = EXCLUDED.is_admin,
        is_active = EXCLUDED.is_active,
        role = EXCLUDED.role,
        last_updated = now()
      RETURNING id, email, username, is_admin, role, created_at;
    `;
    
    if (result && result.length > 0) {
      const user = result[0];
      console.log("\n🎉 Admin user registered successfully!");
      console.log(`✅ User ID: ${user.id}`);
      console.log(`✅ Email: ${user.email}`);
      console.log(`✅ Username: ${user.username}`);
      console.log(`✅ Is Admin: ${user.is_admin}`);
      console.log(`✅ Role: ${user.role}`);
      console.log(`✅ Created: ${user.created_at}`);
      
      console.log("\n🔐 Login Credentials:");
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👑 Role: Admin (Full Access)`);
      
    } else {
      console.log("⚠️  User may already exist, but no data returned");
    }

    await sql.end();
  } catch (error) {
    console.error("❌ Failed to register admin user:", error);
    process.exit(1);
  }
}

registerAdminUser();
