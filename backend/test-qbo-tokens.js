#!/usr/bin/env node

/**
 * QuickBooks Token Management Test Script
 * Tests the token refresh system and provides status information
 */

import dotenv from 'dotenv';
import { qboTokenManager } from './src/services/qboTokenManager.js';

// Load environment variables
dotenv.config();

async function testTokenManagement() {
  console.log('🧪 Testing QuickBooks Token Management System...\n');

  try {
    // Start the token manager
    console.log('1. Starting token manager...');
    await qboTokenManager.start();
    console.log('✅ Token manager started\n');

    // Get token status
    console.log('2. Getting token status...');
    const status = await qboTokenManager.getTokenStatus();
    console.log('📊 Token Status:', JSON.stringify(status, null, 2));
    console.log('');

    // Test token refresh
    console.log('3. Testing token refresh...');
    const refreshResult = await qboTokenManager.forceRefresh();
    console.log(`🔄 Token refresh result: ${refreshResult ? 'SUCCESS' : 'FAILED'}\n`);

    // Get updated status
    console.log('4. Getting updated token status...');
    const updatedStatus = await qboTokenManager.getTokenStatus();
    console.log('📊 Updated Token Status:', JSON.stringify(updatedStatus, null, 2));
    console.log('');

    // Stop the token manager
    console.log('5. Stopping token manager...');
    qboTokenManager.stop();
    console.log('✅ Token manager stopped\n');

    console.log('🎉 Token management test completed successfully!');

  } catch (error) {
    console.error('❌ Token management test failed:', error);
    process.exit(1);
  }
}

// Run the test
testTokenManagement();
