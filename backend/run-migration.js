import { db } from './dist/db/index.js';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    console.log('⚠️  Note: This project uses Supabase. Schema changes should be made in Supabase first.');
    console.log('📖 See backend/db/README.md for proper migration workflow.');
    
    // This script is kept for reference but should not be used
    console.log('❌ This migration script is deprecated.');
    console.log('✅ Use Supabase Studio or CLI for schema changes instead.');
    process.exit(1);
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} statements to execute`);
    statements.forEach((stmt, i) => {
      console.log(`Statement ${i + 1}: ${stmt.substring(0, 100)}...`);
    });
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 80)}...`);
        try {
          await db.execute(statement);
          console.log(`✅ Success`);
        } catch (error) {
          console.error(`❌ Failed: ${error.message}`);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
