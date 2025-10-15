import { qboClient } from './dist/services/qboClient.js';
import { db, tokens } from './dist/db/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function testQuickBooksStructure() {
  try {
    console.log('🔍 Testing QuickBooks API structure...');
    
    // Get the current realm ID from tokens
    const [token] = await db.select().from(tokens).orderBy(tokens.lastUpdated).limit(1);
    
    if (!token) {
      throw new Error('No QuickBooks token found. Please authenticate first.');
    }

    const realmId = token.realmId;
    console.log(`📊 Testing with realm: ${realmId}`);

    // Test token validity first
    const isTokenValid = await qboClient.testToken(realmId);
    if (!isTokenValid) {
      throw new Error('QuickBooks token is invalid. Please refresh the token.');
    }

    console.log('✅ Token is valid');

    // Get a sample invoice to see its structure
    console.log('\n📋 Fetching sample invoice...');
    const invoices = await qboClient.getInvoices(realmId);
    if (invoices.length > 0) {
      console.log('📄 Sample Invoice Structure:');
      console.log(JSON.stringify(invoices[0], null, 2));
    } else {
      console.log('❌ No invoices found');
    }

    // Get a sample item to see its structure
    console.log('\n📦 Fetching sample item...');
    const items = await qboClient.getItems(realmId);
    if (items.length > 0) {
      console.log('📄 Sample Item Structure:');
      console.log(JSON.stringify(items[0], null, 2));
    } else {
      console.log('❌ No items found');
    }

    // Get a sample estimate to see its structure
    console.log('\n📋 Fetching sample estimate...');
    const estimates = await qboClient.getEstimates(realmId);
    if (estimates.length > 0) {
      console.log('📄 Sample Estimate Structure:');
      console.log(JSON.stringify(estimates[0], null, 2));
    } else {
      console.log('❌ No estimates found');
    }

  } catch (error) {
    console.error('❌ Error testing QuickBooks structure:', error);
  } finally {
    process.exit(0);
  }
}

testQuickBooksStructure();
