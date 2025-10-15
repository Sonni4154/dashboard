#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

// QuickBooks API configuration
const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID;
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET;
const QBO_ENV = process.env.QBO_ENV || 'production';
const QBO_BASE_URL = QBO_ENV === 'sandbox' 
  ? 'https://sandbox-quickbooks.api.intuit.com'
  : 'https://quickbooks.api.intuit.com';

async function refreshAccessToken(refreshToken, realmId) {
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
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
  
  // Update token in database
  await sql`
    UPDATE quickbooks.tokens 
    SET access_token = ${data.access_token},
        refresh_token = ${data.refresh_token || refreshToken},
        expires_at = ${expiresAt},
        last_updated = NOW()
    WHERE realm_id = ${realmId}
  `;
  
  console.log(`✅ Token refreshed, expires at: ${expiresAt.toLocaleString()}`);
  return data.access_token;
}

async function fetchFromQuickBooks(endpoint, accessToken, realmId) {
  const url = `${QBO_BASE_URL}/v3/company/${realmId}/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function syncCustomers(accessToken, realmId) {
  console.log('\\n👥 Syncing customers...');
  
  try {
    const data = await fetchFromQuickBooks(
      'query?query=SELECT * FROM Customer MAXRESULTS 1000',
      accessToken,
      realmId
    );
    
    const customers = data.QueryResponse?.Customer || [];
    console.log(`📊 Found ${customers.length} customers`);
    
    for (const customer of customers) {
      await sql`
        INSERT INTO quickbooks.customers (
          id, displayname, companyname, printoncheckname, active,
          primaryphone_freeformnumber, primaryemailaddr_address,
          balance, balancewithjobs, notes, last_updated
        ) VALUES (
          ${customer.Id},
          ${customer.DisplayName || null},
          ${customer.CompanyName || null},
          ${customer.PrintOnCheckName || null},
          ${customer.Active !== false},
          ${customer.PrimaryPhone?.FreeFormNumber || null},
          ${customer.PrimaryEmailAddr?.Address || null},
          ${customer.Balance || 0},
          ${customer.BalanceWithJobs || 0},
          ${customer.Notes || null},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          displayname = EXCLUDED.displayname,
          companyname = EXCLUDED.companyname,
          active = EXCLUDED.active,
          balance = EXCLUDED.balance,
          last_updated = NOW()
      `;
    }
    
    console.log(`✅ Synced ${customers.length} customers`);
    return customers.length;
  } catch (error) {
    console.error('❌ Error syncing customers:', error.message);
    throw error;
  }
}

async function syncInvoices(accessToken, realmId) {
  console.log('\\n🧾 Syncing invoices...');
  
  try {
    const data = await fetchFromQuickBooks(
      'query?query=SELECT * FROM Invoice MAXRESULTS 1000',
      accessToken,
      realmId
    );
    
    const invoices = data.QueryResponse?.Invoice || [];
    console.log(`📊 Found ${invoices.length} invoices`);
    
    for (const invoice of invoices) {
      await sql`
        INSERT INTO quickbooks.invoices (
          id, docnumber, txndate, duedate, totalamt, balance,
          customerref_value, customerref_name, last_updated
        ) VALUES (
          ${invoice.Id},
          ${invoice.DocNumber || null},
          ${invoice.TxnDate || null},
          ${invoice.DueDate || null},
          ${invoice.TotalAmt || 0},
          ${invoice.Balance || 0},
          ${invoice.CustomerRef?.value || null},
          ${invoice.CustomerRef?.name || null},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          docnumber = EXCLUDED.docnumber,
          totalamt = EXCLUDED.totalamt,
          balance = EXCLUDED.balance,
          last_updated = NOW()
      `;
    }
    
    console.log(`✅ Synced ${invoices.length} invoices`);
    return invoices.length;
  } catch (error) {
    console.error('❌ Error syncing invoices:', error.message);
    throw error;
  }
}

async function syncItems(accessToken, realmId) {
  console.log('\\n📦 Syncing items...');
  
  try {
    const data = await fetchFromQuickBooks(
      'query?query=SELECT * FROM Item MAXRESULTS 1000',
      accessToken,
      realmId
    );
    
    const items = data.QueryResponse?.Item || [];
    console.log(`📊 Found ${items.length} items`);
    
    for (const item of items) {
      await sql`
        INSERT INTO quickbooks.items (
          id, fully_qualified_name, sku, description, last_updated
        ) VALUES (
          ${item.Id},
          ${item.FullyQualifiedName || null},
          ${item.Sku || null},
          ${item.Description || null},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          fully_qualified_name = EXCLUDED.fully_qualified_name,
          description = EXCLUDED.description,
          last_updated = NOW()
      `;
    }
    
    console.log(`✅ Synced ${items.length} items`);
    return items.length;
  } catch (error) {
    console.error('❌ Error syncing items:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting QuickBooks data sync...');
    console.log(`Environment: ${QBO_ENV}`);
    
    // Get token from database
    const tokenResult = await sql`
      SELECT id, access_token, refresh_token, realm_id, expires_at
      FROM quickbooks.tokens
      WHERE id = 1
    `;
    
    if (tokenResult.length === 0) {
      throw new Error('No QuickBooks token found in database');
    }
    
    const token = tokenResult[0];
    console.log(`📍 Realm ID: ${token.realm_id}`);
    
    // Check if token is expired
    let accessToken = token.access_token;
    const expiresAt = new Date(token.expires_at);
    const now = new Date();
    
    if (now >= expiresAt) {
      console.log('⏰ Access token expired, refreshing...');
      accessToken = await refreshAccessToken(token.refresh_token, token.realm_id);
    } else {
      console.log(`✅ Token valid until: ${expiresAt.toLocaleString()}`);
    }
    
    // Sync data
    const customerCount = await syncCustomers(accessToken, token.realm_id);
    const invoiceCount = await syncInvoices(accessToken, token.realm_id);
    const itemCount = await syncItems(accessToken, token.realm_id);
    
    console.log('\\n🎉 Sync completed successfully!');
    console.log(`   - ${customerCount} customers`);
    console.log(`   - ${invoiceCount} invoices`);
    console.log(`   - ${itemCount} items`);
    
  } catch (error) {
    console.error('\\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();

