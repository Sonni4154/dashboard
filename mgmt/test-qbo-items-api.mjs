import 'dotenv/config';
import axios from 'axios';

async function testQBOItemsAPI() {
  try {
    // Get the active token
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    const tokens = await sql`
      SELECT "accessToken", "realmId"
      FROM quickbooks.tokens 
      WHERE "isActive" = true
      LIMIT 1;
    `;
    
    if (tokens.length === 0) {
      console.log('❌ No active token found');
      return;
    }
    
    const { accessToken, realmId } = tokens[0];
    
    console.log('🔍 Testing QuickBooks Items API...');
    console.log(`Company ID: ${realmId}`);
    
    // Test the Items API endpoint
    const itemsUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/items`;
    
    const response = await axios.get(itemsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('\n=== API Response Structure ===');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
    
    if (response.data.QueryResponse && response.data.QueryResponse.Item) {
      const items = response.data.QueryResponse.Item;
      console.log(`\nFound ${items.length} items`);
      
      if (items.length > 0) {
        console.log('\n=== Sample Item Structure ===');
        const sampleItem = items[0];
        console.log('Item keys:', Object.keys(sampleItem));
        
        // Check for pricing fields
        const pricingFields = ['UnitPrice', 'SalesPrice', 'PurchaseCost', 'Price', 'Rate', 'Amount'];
        console.log('\n=== Pricing Fields Check ===');
        pricingFields.forEach(field => {
          if (sampleItem[field] !== undefined) {
            console.log(`✅ ${field}: ${sampleItem[field]}`);
          } else {
            console.log(`❌ ${field}: Not found`);
          }
        });
        
        // Show full structure of first item
        console.log('\n=== Full Sample Item ===');
        console.log(JSON.stringify(sampleItem, null, 2));
      }
    } else {
      console.log('\n❌ Unexpected API response structure:');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Token might be expired or invalid');
    }
  }
}

testQBOItemsAPI();
