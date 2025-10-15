import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkAllItems() {
  console.log('=== All Items in Database ===');
  
  const items = await sql`
    SELECT id, fully_qualified_name, sku, unitprice, salesprice, type
    FROM quickbooks.items 
    ORDER BY id
    LIMIT 20;
  `;
  
  items.forEach(item => {
    console.log(`${item.id}: ${item.fully_qualified_name} - Unit: ${item.unitprice}, Sales: ${item.salesprice}, Type: ${item.type}`);
  });
  
  console.log('\n=== Items with any pricing data ===');
  const priced = await sql`
    SELECT id, fully_qualified_name, unitprice, salesprice, type
    FROM quickbooks.items 
    WHERE unitprice IS NOT NULL OR salesprice IS NOT NULL
    LIMIT 10;
  `;
  
  if (priced.length === 0) {
    console.log('❌ NO ITEMS HAVE PRICING DATA!');
  } else {
    priced.forEach(item => {
      console.log(`${item.id}: ${item.fully_qualified_name} - Unit: ${item.unitprice}, Sales: ${item.salesprice}`);
    });
  }
}

checkAllItems();
