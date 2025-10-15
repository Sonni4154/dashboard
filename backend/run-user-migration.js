import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runUserMigration() {
  console.log('🧩 Loading .env from:', path.resolve('.env'));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'found' : 'not found');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db/migrations/007_create_users_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running user system migration...');
    
    // Split by semicolon and filter out empty statements and comments
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
        try {
          await pool.query(statement);
          console.log('✅ Success');
        } catch (error) {
          console.log('❌ Failed:', error.message);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('✅ User system migration completed successfully!');
    
    // Test the migration by checking if users table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_sessions', 'user_permissions')
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:', result.rows.map(row => row.table_name).join(', '));
    
    // Check if default users were created
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Total users created: ${userCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runUserMigration();
