import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addQtyColumn() {
  try {
    await sql`
      ALTER TABLE quickbooks.estimate_line_items 
      ADD COLUMN IF NOT EXISTS qty DECIMAL(15,2);
    `;
    
    console.log('✅ Added qty column to estimate_line_items table');
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
}

addQtyColumn();
