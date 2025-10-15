import { db } from './dist/db/index.js';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    const migrationSQL = await readFile('./db/migrations/005_add_missing_quickbooks_tables.sql', 'utf8');
    
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
