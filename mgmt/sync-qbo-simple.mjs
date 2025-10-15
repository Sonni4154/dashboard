#!/usr/bin/env node
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID;
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET;
const QBO_REFRESH_TOKEN = process.env.QBO_REFRESH_ACCESS_TOKEN;
const QBO_REALM_ID = process.env.QBO_REALM_ID;
const QBO_ENV = process.env.QBO_ENV || 'production';

const QBO_BASE_URL = QBO_ENV === 'sandbox' 
  ? 'https://sandbox-quickbooks.api.intuit.com'
  : 'https://quickbooks.api.intuit.com';

async function refreshAccessToken() {
  console.log('🔄 Refreshing access token...');
  
  const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const auth = Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: QBO_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`✅ Token refreshed successfully`);
  return data.access_token;
}

async function fetchCustomers(accessToken) {
  console.log('\\n👥 Fetching customers from QuickBooks...');
  
  const url = `${QBO_BASE_URL}/v3/company/${QBO_REALM_ID}/query?query=SELECT * FROM Customer MAXRESULTS 10`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`QuickBooks API error: ${response.status}`);
  }

  const data = await response.json();
  const customers = data.QueryResponse?.Customer || [];
  
  console.log(`📊 Found ${customers.length} customers:`);
  customers.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.DisplayName} (ID: ${c.Id}) - Balance: $${c.Balance || 0}`);
  });
  
  return customers;
}

async function fetchInvoices(accessToken) {
  console.log('\\n🧾 Fetching invoices from QuickBooks...');
  
  const url = `${QBO_BASE_URL}/v3/company/${QBO_REALM_ID}/query?query=SELECT * FROM Invoice MAXRESULTS 10`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`QuickBooks API error: ${response.status}`);
  }

  const data = await response.json();
  const invoices = data.QueryResponse?.Invoice || [];
  
  console.log(`📊 Found ${invoices.length} invoices:`);
  invoices.forEach((inv, i) => {
    console.log(`   ${i + 1}. Invoice #${inv.DocNumber} - $${inv.TotalAmt} (Customer: ${inv.CustomerRef?.name})`);
  });
  
  return invoices;
}

async function main() {
  try {
    console.log('🚀 Testing QuickBooks connection...');
    console.log(`Environment: ${QBO_ENV}`);
    console.log(`Realm ID: ${QBO_REALM_ID}`);
    
    const accessToken = await refreshAccessToken();
    const customers = await fetchCustomers(accessToken);
    const invoices = await fetchInvoices(accessToken);
    
    console.log('\\n🎉 QuickBooks connection successful!');
    console.log(`   - ${customers.length} customers found`);
    console.log(`   - ${invoices.length} invoices found`);
    console.log('\\nℹ️  Use the Neon MCP tools or backend to insert this data into your database');
    
  } catch (error) {
    console.error('\\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

