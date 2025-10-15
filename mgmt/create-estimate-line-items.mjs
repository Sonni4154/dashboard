import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function createEstimateLineItems() {
  try {
    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS quickbooks.estimate_line_items (
        id SERIAL PRIMARY KEY,
        estimate_id INTEGER REFERENCES quickbooks.estimates(id) ON DELETE CASCADE,
        line_num INTEGER,
        detail_type VARCHAR(50),
        amount DECIMAL(15,2),
        itemref_value VARCHAR(50),
        itemref_name VARCHAR(255),
        description TEXT,
        quantity DECIMAL(15,2),
        unitprice DECIMAL(15,2),
        taxcode_ref VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id 
      ON quickbooks.estimate_line_items(estimate_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_estimate_line_items_itemref_value 
      ON quickbooks.estimate_line_items(itemref_value);
    `;
    
    console.log('✅ Created quickbooks.estimate_line_items table and indexes');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

createEstimateLineItems();
