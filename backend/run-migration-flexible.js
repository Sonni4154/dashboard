import { db } from './dist/db/index.js';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function runMigration() {
  try {
    console.log('⚠️  DEPRECATED: This project uses Supabase for schema management.');
    console.log('📖 See backend/db/README.md for proper migration workflow.');
    console.log('✅ Use Supabase Studio or CLI instead of this script.');
    process.exit(1);

    const migrationSQL = await readFile(migrationFile, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} statements to execute\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 80)}...`);
        try {
          await db.execute(statement);
          console.log('✅ Success');
          successCount++;
        } catch (error) {
          console.log(`❌ Failed: ${error.message}`);
          failCount++;
          // Continue with other statements even if one fails
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    
    if (failCount === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${failCount} error(s)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
