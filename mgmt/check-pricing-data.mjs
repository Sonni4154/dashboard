import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkPricingData() {
  try {
    // Check items with pricing data
    const items = await sql`
      SELECT id, name, fully_qualified_name, unitprice, salesprice, type, qtyonhand
      FROM quickbooks.items 
      WHERE unitprice > 0 OR salesprice > 0
      ORDER BY unitprice DESC, salesprice DESC
      LIMIT 10;
    `;
    
    console.log('=== Items with Pricing Data ===');
    items.forEach(item => {
      console.log(`ID: ${item.id}`);
      console.log(`Name: ${item.name || item.fully_qualified_name}`);
      console.log(`Unit Price: $${item.unitprice || 0}`);
      console.log(`Sales Price: $${item.salesprice || 0}`);
      console.log(`Type: ${item.type}`);
      console.log(`Qty: ${item.qtyonhand || 0}`);
      console.log('---');
    });
    
    // Check total count of items
    const totalItems = await sql`
      SELECT COUNT(*) as total FROM quickbooks.items;
    `;
    
    console.log(`\nTotal items in database: ${totalItems[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPricingData();