import { db } from '../dist/db/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDb() {
  console.log('🧪 Testing Database Connection and Schema...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const connectionTest = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful\n');
    
    // Check schemas
    console.log('2. Checking database schemas...');
    const schemas = await db.execute(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('quickbooks', 'google', 'dashboard', 'jibble', 'import')
      ORDER BY schema_name
    `);
    console.log('📋 Available schemas:', schemas.rows.map(row => row.schema_name).join(', '));
    console.log('');
    
    // Check QuickBooks tables
    console.log('3. Checking QuickBooks tables...');
    const qbTables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'quickbooks' 
      ORDER BY table_name
    `);
    
    if (qbTables.rows.length > 0) {
      console.log('✅ QuickBooks tables found:', qbTables.rows.map(row => row.table_name).join(', '));
      
      // Check tokens table structure
      console.log('\n4. Checking tokens table structure...');
      const tokenColumns = await db.execute(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'quickbooks' 
        AND table_name = 'tokens' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Tokens table columns:');
      tokenColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } else {
      console.log('❌ No QuickBooks tables found!');
      console.log('💡 Run schema setup in Supabase first');
    }
    
    // Test basic operations
    console.log('\n5. Testing basic database operations...');
    
    // Test insert/select (if tokens table exists)
    if (qbTables.rows.some(row => row.table_name === 'tokens')) {
      const testResult = await db.execute(`
        SELECT COUNT(*) as count 
        FROM quickbooks.tokens 
        WHERE is_active = true
      `);
      console.log(`✅ Active tokens count: ${testResult.rows[0].count}`);
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('💡 Check your DATABASE_URL and ensure database is accessible');
    process.exit(1);
  }
}

testDb();

