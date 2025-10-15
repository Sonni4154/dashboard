#!/usr/bin/env node

/**
 * Initialize QuickBooks tokens from existing refresh token
 * 
 * This script uses your existing QBO_REFRESH_ACCESS_TOKEN from environment
 * to get a fresh access token and store it in the database.
 * 
 * Usage:
 *   node init-tokens-from-refresh.js
 * 
 * Prerequisites:
 *   - DATABASE_URL set
 *   - QBO_CLIENT_ID set
 *   - QBO_CLIENT_SECRET set
 *   - QBO_REFRESH_ACCESS_TOKEN set
 *   - QBO_REALM_ID set
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { db } from './dist/db/index.js';
import { tokens } from './dist/db/index.js';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: './env.production' });

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function initializeTokens() {
  try {
    log('═══════════════════════════════════════════════════════════', 'cyan');
    log('  QuickBooks Token Initialization from Refresh Token', 'cyan');
    log('═══════════════════════════════════════════════════════════', 'cyan');
    console.log();

    // Validate environment variables
    const clientId = process.env.QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;
    const refreshToken = process.env.QBO_REFRESH_ACCESS_TOKEN;
    const realmId = process.env.QBO_REALM_ID;
    const qboEnv = process.env.QBO_ENV || 'production';

    if (!clientId) throw new Error('Missing QBO_CLIENT_ID');
    if (!clientSecret) throw new Error('Missing QBO_CLIENT_SECRET');
    if (!refreshToken) throw new Error('Missing QBO_REFRESH_ACCESS_TOKEN');
    if (!realmId) throw new Error('Missing QBO_REALM_ID');

    log('✓ Environment variables validated', 'green');
    log(`  Realm ID: ${realmId}`, 'blue');
    log(`  Environment: ${qboEnv}`, 'blue');
    console.log();

    // Check if token already exists for this realm
    log('Checking for existing tokens...', 'yellow');
    const existingTokens = await db
      .select()
      .from(tokens)
      .where(eq(tokens.realmId, realmId));

    if (existingTokens.length > 0) {
      log(`⚠ Found ${existingTokens.length} existing token(s) for realm ${realmId}`, 'yellow');
      log('  These will be marked as inactive and a new token will be created.', 'yellow');
      
      // Mark existing tokens as inactive
      for (const token of existingTokens) {
        await db
          .update(tokens)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(tokens.id, token.id));
      }
      log('✓ Existing tokens marked as inactive', 'green');
    } else {
      log('✓ No existing tokens found', 'green');
    }
    console.log();

    // Use refresh token to get new access token
    log('Using refresh token to obtain new access token...', 'yellow');
    
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    const {
      access_token,
      refresh_token: newRefreshToken,
      expires_in,
      x_refresh_token_expires_in,
      token_type,
      scope,
    } = response.data;

    log('✓ Successfully obtained new access token', 'green');
    console.log();

    // Calculate expiration times
    const expiresIn = Number(expires_in ?? 3600);
    const refreshExpiresIn = Number(x_refresh_token_expires_in ?? 60 * 60 * 24 * 100);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    const refreshTokenExpiresAt = new Date(now.getTime() + refreshExpiresIn * 1000);

    log('Token Details:', 'cyan');
    log(`  Access Token Expires: ${expiresAt.toLocaleString()}`, 'blue');
    log(`  Refresh Token Expires: ${refreshTokenExpiresAt.toLocaleString()}`, 'blue');
    log(`  Token Type: ${token_type || 'Bearer'}`, 'blue');
    log(`  Scope: ${scope || 'com.intuit.quickbooks.accounting'}`, 'blue');
    console.log();

    // Determine base URL
    const baseUrl = qboEnv === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    // Save to database
    log('Saving token to database...', 'yellow');
    
    const tokenId = BigInt(Date.now());
    
    await db.insert(tokens).values({
      id: tokenId,
      companyId: realmId,
      accessToken: access_token,
      refreshToken: newRefreshToken || refreshToken,
      tokenType: token_type || 'Bearer',
      scope: scope || 'com.intuit.quickbooks.accounting',
      expiresAt,
      refreshTokenExpiresAt,
      realmId,
      baseUrl,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    });

    log('✓ Token saved to database successfully!', 'green');
    console.log();

    log('═══════════════════════════════════════════════════════════', 'green');
    log('  ✓ QuickBooks Token Initialization Complete!', 'green');
    log('═══════════════════════════════════════════════════════════', 'green');
    console.log();

    log('Next Steps:', 'cyan');
    log('1. Test the integration:', 'blue');
    log('   curl http://localhost:5000/api/tokens/status', 'reset');
    log('   curl http://localhost:5000/api/customers', 'reset');
    console.log();
    log('2. Token will auto-refresh every 50 minutes', 'blue');
    log('3. Monitor logs for successful refresh operations', 'blue');
    console.log();

    // Update environment variable recommendation
    if (newRefreshToken && newRefreshToken !== refreshToken) {
      log('⚠ Recommendation:', 'yellow');
      log('  Update your QBO_REFRESH_ACCESS_TOKEN in env.production:', 'yellow');
      log(`  QBO_REFRESH_ACCESS_TOKEN="${newRefreshToken}"`, 'reset');
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.log();
    log('═══════════════════════════════════════════════════════════', 'red');
    log('  ✗ Token Initialization Failed', 'red');
    log('═══════════════════════════════════════════════════════════', 'red');
    console.log();

    log('Error Details:', 'red');
    log(`  ${error.message}`, 'reset');
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        log('\nQuickBooks API Response:', 'red');
        log(`  Status: ${error.response.status}`, 'reset');
        log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`, 'reset');
        
        if (error.response.status === 400) {
          console.log();
          log('Possible Issues:', 'yellow');
          log('  - Refresh token has expired (after ~100 days)', 'reset');
          log('  - Refresh token was revoked', 'reset');
          log('  - Client credentials are incorrect', 'reset');
          console.log();
          log('Solution:', 'cyan');
          log('  Re-authorize via OAuth flow:', 'reset');
          log('  Visit: https://api.wemakemarin.com/api/qbo/connect', 'reset');
        }
      }
    }

    console.log();
    process.exit(1);
  }
}

// Run the script
initializeTokens();

