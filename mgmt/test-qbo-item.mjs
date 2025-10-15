import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function testQBOItem() {
  try {
    // Get a token
    const tokens = await sql`SELECT * FROM quickbooks.tokens WHERE "realmId" = '9130354674010826' AND "isActive" = true ORDER BY "lastUpdated" DESC LIMIT 1`;
    
    if (tokens.length === 0) {
      console.log('No active token found');
      return;
    }
    
    const token = tokens[0];
    console.log('Using token:', token.id);
    
    // Test QuickBooks API call
    const axios = (await import('axios')).default;
    
    const response = await axios.get(`https://sandbox-quickbooks.api.intuit.com/v3/company/${token.realmId}/items/299`, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('=== QuickBooks API Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testQBOItem();
