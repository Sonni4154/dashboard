import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  console.log('=== Items Table Schema ===');
  
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'quickbooks' 
    AND table_name = 'items'
    ORDER BY ordinal_position;
  `;
  
  columns.forEach(col => {
    console.log(`${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
  });
  
  console.log('\n=== Sample Item Data (all columns) ===');
  const sample = await sql`
    SELECT *
    FROM quickbooks.items 
    WHERE id IN (299, 300)
    LIMIT 2;
  `;
  
  if (sample.length > 0) {
    Object.entries(sample[0]).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  }
}

checkSchema();
