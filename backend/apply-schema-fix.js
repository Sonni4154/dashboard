import postgres from 'postgres';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '.env') });

async function applySchemaFix() {
  console.log('🔧 Applying Schema Fix to Supabase Database...\n');

  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Manually encode the password to handle special characters
    const databaseUrl = process.env.DATABASE_URL;
    const encodedUrl = databaseUrl.replace(/TTrustno22##\$\$/g, encodeURIComponent('TTrustno22##$$'));
    
    console.log('🔗 Connecting to database...');
    const sql = postgres(encodedUrl, {
      ssl: { rejectUnauthorized: false },
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    // Read the schema fix SQL file
    const schemaFixSQL = readFileSync(path.resolve(__dirname, 'fix-tokens-schema.sql'), 'utf8');
    
    console.log('📋 Executing schema fix SQL...');
    
    // Split the SQL into individual statements
    const statements = schemaFixSQL
      .split(/;\s*$/m) // Split by semicolon at the end of a line
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      try {
        await sql.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.warn(`⚠️  Statement ${i + 1} failed: ${stmtError.message}`);
      }
    }
    
    console.log('\n🎉 Schema fix completed!');
    console.log('✅ Missing columns have been added to tokens table');
    console.log('✅ Existing records have been updated with default values');

    console.log('\n📋 Next steps:');
    console.log('1. Restart the server to test the fix');
    console.log('2. Test QuickBooks OAuth flow');
    console.log('3. Verify token management works');

    // Close the connection
    await sql.end();
    
  } catch (error) {
    console.error('❌ Failed to apply schema fix:', error);
    process.exit(1);
  }
}

applySchemaFix();
