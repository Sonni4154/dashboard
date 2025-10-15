import { db } from './dist/db/index.js';

async function checkItemsSchema() {
  try {
    const result = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'quickbooks' 
      AND table_name = 'items' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Items table columns:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Also check a sample item to see what fields have values
    const sampleResult = await db.execute('SELECT * FROM quickbooks.items LIMIT 1');
    console.log('\nSample item data:');
    console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkItemsSchema();
