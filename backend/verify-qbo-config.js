#!/usr/bin/env node

/**
 * Verify QuickBooks OAuth Configuration
 * 
 * This script checks if all required environment variables are set
 * and validates the configuration before running token initialization.
 * 
 * Usage: node verify-qbo-config.js
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: './env.production' });

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function check(condition, successMsg, failMsg) {
  if (condition) {
    log(`✓ ${successMsg}`, 'green');
    return true;
  } else {
    log(`✗ ${failMsg}`, 'red');
    return false;
  }
}

console.clear();
log('═══════════════════════════════════════════════════════════', 'cyan');
log('  QuickBooks OAuth 2.0 Configuration Verification', 'cyan');
log('═══════════════════════════════════════════════════════════', 'cyan');
console.log();

let allChecks = true;

// Check Environment Variables
log('1. Environment Variables', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');

const clientId = process.env.QBO_CLIENT_ID;
allChecks &= check(
  clientId && clientId.length > 0,
  `QBO_CLIENT_ID is set (${clientId?.substring(0, 10)}...)`,
  'QBO_CLIENT_ID is missing'
);

const clientSecret = process.env.QBO_CLIENT_SECRET;
allChecks &= check(
  clientSecret && clientSecret.length > 0,
  `QBO_CLIENT_SECRET is set (${clientSecret?.substring(0, 10)}...)`,
  'QBO_CLIENT_SECRET is missing'
);

const redirectUri = process.env.QBO_REDIRECT_URI;
allChecks &= check(
  redirectUri && redirectUri.length > 0,
  `QBO_REDIRECT_URI: ${redirectUri}`,
  'QBO_REDIRECT_URI is missing'
);

const realmId = process.env.QBO_REALM_ID;
allChecks &= check(
  realmId && realmId.length > 0,
  `QBO_REALM_ID: ${realmId}`,
  'QBO_REALM_ID is missing'
);

const refreshToken = process.env.QBO_REFRESH_ACCESS_TOKEN;
allChecks &= check(
  refreshToken && refreshToken.length > 0,
  `QBO_REFRESH_ACCESS_TOKEN is set (${refreshToken?.substring(0, 15)}...)`,
  'QBO_REFRESH_ACCESS_TOKEN is missing (optional, but needed for quick setup)'
);

const qboEnv = process.env.QBO_ENV;
allChecks &= check(
  qboEnv && (qboEnv === 'production' || qboEnv === 'sandbox'),
  `QBO_ENV: ${qboEnv}`,
  'QBO_ENV must be "production" or "sandbox"'
);

const scope = process.env.QBO_SCOPE;
check(
  scope && scope.length > 0,
  `QBO_SCOPE: ${scope}`,
  'QBO_SCOPE not set (will default to com.intuit.quickbooks.accounting)'
);

console.log();

// Check Database Connection
log('2. Database Configuration', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');

const dbUrl = process.env.DATABASE_URL;
allChecks &= check(
  dbUrl && dbUrl.includes('postgresql://'),
  'DATABASE_URL is set and looks valid',
  'DATABASE_URL is missing or invalid'
);

if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    log(`  Host: ${url.hostname}`, 'blue');
    log(`  Database: ${url.pathname.substring(1)}`, 'blue');
    log(`  SSL: ${url.searchParams.get('sslmode') || 'not specified'}`, 'blue');
  } catch (e) {
    log('  Warning: Could not parse DATABASE_URL', 'yellow');
  }
}

console.log();

// Check Redirect URI Format
log('3. Redirect URI Analysis', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');

if (redirectUri) {
  const isHttps = redirectUri.startsWith('https://');
  check(
    isHttps,
    'Redirect URI uses HTTPS (required for production)',
    'Redirect URI should use HTTPS in production'
  );

  const hasCallback = redirectUri.includes('/callback');
  check(
    hasCallback,
    'Redirect URI includes /callback endpoint',
    'Redirect URI should point to /callback endpoint'
  );

  // Check which domain is being used
  if (redirectUri.includes('api.wemakemarin.com')) {
    log('  ℹ Using api subdomain (direct backend access)', 'blue');
    log('  Expected endpoint: https://api.wemakemarin.com/api/qbo/callback', 'blue');
  } else if (redirectUri.includes('www.wemakemarin.com')) {
    log('  ℹ Using www domain (assumes nginx proxy to backend)', 'blue');
    log('  Expected endpoint: https://www.wemakemarin.com/api/qbo/callback', 'blue');
    log('  ⚠ Make sure nginx proxies /api/* to backend!', 'yellow');
  }
}

console.log();

// Check Migration File
log('4. Migration File', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');

try {
  const migrationPath = './db/migrations/002_update_tokens_table.sql';
  const migrationContent = readFileSync(migrationPath, 'utf-8');
  check(
    migrationContent.includes('quickbooks.tokens'),
    'Migration file exists and looks correct',
    'Migration file not found or invalid'
  );
} catch (e) {
  allChecks &= check(
    false,
    'Migration file exists',
    'Migration file not found: db/migrations/002_update_tokens_table.sql'
  );
}

console.log();

// Check TypeScript Build
log('5. Backend Build', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');

try {
  const distExists = readFileSync('./dist/db/index.js', 'utf-8');
  check(
    true,
    'Backend is built (dist/ directory exists)',
    'Backend needs to be built'
  );
} catch (e) {
  log('✗ Backend not built - run: npm run build', 'red');
  log('  This is required before running token initialization', 'yellow');
  allChecks = false;
}

console.log();

// Summary
log('═══════════════════════════════════════════════════════════', 'cyan');
if (allChecks) {
  log('  ✓ All Checks Passed!', 'green');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  console.log();
  log('Next Steps:', 'bold');
  log('─────────────────────────────────────────────────────────', 'cyan');
  log('1. Run database migration:', 'blue');
  log('   psql $DATABASE_URL -f db/migrations/002_update_tokens_table.sql', 'reset');
  console.log();
  log('2. Initialize tokens from refresh token:', 'blue');
  log('   node init-tokens-from-refresh.js', 'reset');
  console.log();
  log('3. Rebuild and restart backend:', 'blue');
  log('   npm run build && pm2 restart backend', 'reset');
  console.log();
  log('4. Test the integration:', 'blue');
  log('   curl http://localhost:5000/api/tokens/status', 'reset');
  log('   curl http://localhost:5000/api/customers', 'reset');
  console.log();
} else {
  log('  ✗ Some Checks Failed', 'red');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  console.log();
  log('Please fix the issues above before proceeding.', 'yellow');
  console.log();
  log('Common Fixes:', 'bold');
  log('─────────────────────────────────────────────────────────', 'cyan');
  log('• Make sure env.production file exists and is loaded', 'blue');
  log('• Run: npm run build (if backend not built)', 'blue');
  log('• Check environment variables are set correctly', 'blue');
  log('• Ensure migration file exists', 'blue');
  console.log();
  process.exit(1);
}

// Additional Recommendations
log('Recommendations:', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');
log('• Backup your database before running migration', 'yellow');
log('• Update redirect URI in QuickBooks Developer Portal', 'yellow');
log('• Monitor logs after initialization for auto-refresh', 'yellow');
log('• Test all QuickBooks endpoints after setup', 'yellow');
console.log();

log('Documentation:', 'bold');
log('─────────────────────────────────────────────────────────', 'cyan');
log('• Quick Start: YOUR-QUICKBOOKS-SETUP.md', 'blue');
log('• Full Guide: QUICKBOOKS-OAUTH-2.0-COMPLETE-GUIDE.md', 'blue');
log('• Quick Reference: QUICKBOOKS-OAUTH-QUICK-REFERENCE.md', 'blue');
console.log();

