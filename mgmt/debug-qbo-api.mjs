import 'dotenv/config';
import axios from 'axios';

async function debugQBOAPI() {
  try {
    // Get the active token
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    const tokens = await sql`
      SELECT "accessToken", "realmId", "expiresAt"
      FROM quickbooks.tokens 
      WHERE "isActive" = true
      LIMIT 1;
    `;
    
    if (tokens.length === 0) {
      console.log('❌ No active token found');
      return;
    }
    
    const { accessToken, realmId, expiresAt } = tokens[0];
    
    console.log('🔍 Debugging QuickBooks API...');
    console.log(`Company ID: ${realmId}`);
    console.log(`Token expires: ${expiresAt}`);
    console.log(`Environment: ${process.env.QBO_ENV || 'not set'}`);
    
    // Try both sandbox and production URLs
    const environments = [
      { name: 'Sandbox', url: 'https://sandbox-quickbooks.api.intuit.com' },
      { name: 'Production', url: 'https://quickbooks.api.intuit.com' }
    ];
    
    for (const env of environments) {
      console.log(`\n=== Testing ${env.name} Environment ===`);
      
      try {
        // Test CompanyInfo first (simpler endpoint)
        const companyInfoUrl = `${env.url}/v3/company/${realmId}/companyinfo/1`;
        
        console.log(`Testing: ${companyInfoUrl}`);
        
        const response = await axios.get(companyInfoUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        console.log(`✅ ${env.name} CompanyInfo works!`);
        console.log('Company Name:', response.data.CompanyInfo?.CompanyName);
        
        // Now test Items API
        const itemsUrl = `${env.url}/v3/company/${realmId}/items`;
        console.log(`\nTesting Items API: ${itemsUrl}`);
        
        const itemsResponse = await axios.get(itemsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        console.log(`✅ ${env.name} Items API works!`);
        
        if (itemsResponse.data.QueryResponse && itemsResponse.data.QueryResponse.Item) {
          const items = itemsResponse.data.QueryResponse.Item;
          console.log(`Found ${items.length} items`);
          
          if (items.length > 0) {
            const sampleItem = items[0];
            console.log('\n=== Sample Item Fields ===');
            Object.keys(sampleItem).forEach(key => {
              console.log(`${key}: ${sampleItem[key]}`);
            });
            
            // Check specifically for pricing
            console.log('\n=== Pricing Information ===');
            console.log('UnitPrice:', sampleItem.UnitPrice);
            console.log('SalesPrice:', sampleItem.SalesPrice);
            console.log('PurchaseCost:', sampleItem.PurchaseCost);
          }
        }
        
        break; // Found working environment
        
      } catch (error) {
        console.log(`❌ ${env.name} failed:`, error.response?.status, error.response?.data?.fault?.error?.[0]?.detail || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugQBOAPI();
