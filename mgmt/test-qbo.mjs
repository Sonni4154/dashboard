#!/usr/bin/env node

// QuickBooks credentials from backendenv
const QBO_CLIENT_ID = 'ABcxWWL62bJFQd43vWFkko728BJLReocAxJKfeeemZtXfVAO1S';
const QBO_CLIENT_SECRET = 'JfTKMbJpJXbR6SByI0SejgZ3eS8pWdt4hKt5r3ls';
const QBO_REFRESH_TOKEN = 'RT1-86-H0-17685210265bih68r86xbf1ucaqqur';
const QBO_REALM_ID = '9130354674010826';
const QBO_BASE_URL = 'https://quickbooks.api.intuit.com';

async function refreshAccessToken() {
  console.log('🔄 Refreshing QuickBooks access token...');
  
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
    console.error('Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Token refreshed successfully`);
  return data;
}

async function fetchFromQBO(endpoint, accessToken) {
  const url = `${QBO_BASE_URL}/v3/company/${QBO_REALM_ID}/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error (${response.status}): ${error}`);
  }

  return await response.json();
}

async function main() {
  try {
    console.log('🚀 Testing QuickBooks API connection...');
    console.log(`📍 Realm ID: ${QBO_REALM_ID}\\n`);
    
    // Get fresh access token
    const tokenData = await refreshAccessToken();
    const accessToken = tokenData.access_token;
    
    // Fetch customers
    console.log('\\n👥 Fetching customers...');
    const customerData = await fetchFromQBO('query?query=SELECT * FROM Customer MAXRESULTS 10', accessToken);
    const customers = customerData.QueryResponse?.Customer || [];
    
    console.log(`📊 Found ${customers.length} customers:`);
    customers.slice(0, 5).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.DisplayName} (ID: ${c.Id})`);
      if (c.PrimaryEmailAddr) console.log(`      Email: ${c.PrimaryEmailAddr.Address}`);
      if (c.Balance) console.log(`      Balance: $${c.Balance}`);
    });
    
    // Fetch invoices
    console.log('\\n🧾 Fetching invoices...');
    const invoiceData = await fetchFromQBO('query?query=SELECT * FROM Invoice MAXRESULTS 10', accessToken);
    const invoices = invoiceData.QueryResponse?.Invoice || [];
    
    console.log(`📊 Found ${invoices.length} invoices:`);
    invoices.slice(0, 5).forEach((inv, i) => {
      console.log(`   ${i + 1}. Invoice #${inv.DocNumber} - $${inv.TotalAmt}`);
      console.log(`      Customer: ${inv.CustomerRef?.name}`);
      console.log(`      Date: ${inv.TxnDate}`);
    });
    
    console.log('\\n🎉 QuickBooks API connection successful!');
    console.log(`   - ${customers.length} customers available`);
    console.log(`   - ${invoices.length} invoices available`);
    console.log('\\n✅ Your QuickBooks credentials are working!');
    console.log('📝 Now we need to insert this data into your Neon database...');
    
    return { customers, invoices, accessToken };
    
  } catch (error) {
    console.error('\\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();

