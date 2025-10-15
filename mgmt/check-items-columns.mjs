import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkItemsColumns() {
  try {
    // Get a sample item to see what columns have data
    const sampleItems = await sql`
      SELECT *
      FROM quickbooks.items 
      LIMIT 3;
    `;
    
    console.log('=== Sample Items Data ===');
    sampleItems.forEach((item, i) => {
      console.log(`\n--- Item ${i + 1} ---`);
      Object.entries(item).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          console.log(`${key}: ${value}`);
        }
      });
    });
    
    // Check what pricing-related columns exist
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'quickbooks' AND table_name = 'items'
      AND column_name LIKE '%price%' OR column_name LIKE '%cost%' OR column_name LIKE '%amount%'
      ORDER BY column_name;
    `;
    
    console.log('\n=== Pricing-Related Columns ===');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkItemsColumns();
