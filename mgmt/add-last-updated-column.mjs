import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addLastUpdatedColumn() {
  try {
    await sql`
      ALTER TABLE quickbooks.estimate_line_items 
      ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `;
    
    console.log('✅ Added last_updated column to estimate_line_items table');
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
}

addLastUpdatedColumn();
