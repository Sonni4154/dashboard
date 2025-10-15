import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkTablesAndFixFK() {
  try {
    // Check what tables exist in quickbooks schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'quickbooks' 
      ORDER BY table_name;
    `;
    
    console.log('=== QuickBooks Tables ===');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Check if estimates table exists
    const estimatesExists = tables.some(t => t.table_name === 'estimates');
    
    if (!estimatesExists) {
      console.log('\n❌ estimates table does not exist!');
      return;
    }
    
    // Check estimates table structure
    const estimatesColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'quickbooks' AND table_name = 'estimates'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n=== Estimates Table Structure ===');
    estimatesColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Temporarily drop the foreign key constraint
    console.log('\n🔧 Dropping foreign key constraint...');
    await sql`
      ALTER TABLE quickbooks.estimate_line_items 
      DROP CONSTRAINT IF EXISTS estimate_line_items_estimate_id_fkey;
    `;
    
    console.log('✅ Foreign key constraint dropped');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTablesAndFixFK();
