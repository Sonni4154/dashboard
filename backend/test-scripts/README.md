# 🧪 Backend Test Scripts

This directory contains test and validation scripts for the Marin Pest Control Dashboard backend.

---

## 📂 Script Categories

### 🔍 Check Scripts
Database and schema validation scripts:

- `check-calendar-schema.js` - Validates Google Calendar schema
- `check-schema.js` - Validates database schema integrity
- `check-table-structure.sh` - Checks table structure and relationships

### 🧪 Test Scripts
API and integration testing scripts:

- `test-db.js` - Tests database connectivity and basic operations
- `test-qbo-structure.js` - Tests QuickBooks API structure and data
- `test-qbo-tokens.js` - Tests QuickBooks token management
- `test-sync-with-lineitems.js` - Tests data synchronization with line items
- `test-webhook.js` - Tests webhook endpoints

### 🔧 Verification Scripts
Configuration and setup validation:

- `verify-qbo-config.js` - Verifies QuickBooks configuration

---

## 🚀 Running Scripts

### Prerequisites

1. **Environment Setup:**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   ```

2. **Dependencies:**
   ```bash
   npm install
   ```

3. **Build Backend:**
   ```bash
   npm run build
   ```

### Running Individual Scripts

```bash
# Database connectivity test
node test-scripts/test-db.js

# QuickBooks configuration check
node test-scripts/verify-qbo-config.js

# Schema validation
node test-scripts/check-schema.js

# QuickBooks API test
node test-scripts/test-qbo-structure.js

# Token management test
node test-scripts/test-qbo-tokens.js

# Webhook test
node test-scripts/test-webhook.js
```

### Running All Tests

```bash
# Run all test scripts
for script in test-scripts/*.js; do
  echo "Running $script..."
  node "$script"
  echo "---"
done
```

---

## 📋 Script Details

### `test-db.js`
**Purpose:** Tests database connectivity and basic operations

**What it tests:**
- Database connection
- Schema existence
- Basic CRUD operations
- Table relationships

**Usage:**
```bash
node test-scripts/test-db.js
```

**Expected output:**
```
✅ Database connection successful
✅ Schema 'quickbooks' exists
✅ Table 'tokens' exists
✅ Table 'customers' exists
```

### `verify-qbo-config.js`
**Purpose:** Validates QuickBooks configuration

**What it checks:**
- Environment variables
- API credentials
- OAuth configuration
- Redirect URIs

**Usage:**
```bash
node test-scripts/verify-qbo-config.js
```

### `test-qbo-tokens.js`
**Purpose:** Tests QuickBooks token management

**What it tests:**
- Token storage
- Token refresh
- Token validation
- Error handling

**Usage:**
```bash
node test-scripts/test-qbo-tokens.js
```

### `test-qbo-structure.js`
**Purpose:** Tests QuickBooks API structure

**What it tests:**
- API connectivity
- Data structure validation
- Field mapping
- Response parsing

**Usage:**
```bash
node test-scripts/test-qbo-structure.js
```

### `test-webhook.js`
**Purpose:** Tests webhook endpoints

**What it tests:**
- Webhook URL accessibility
- Request/response handling
- Authentication
- Error scenarios

**Usage:**
```bash
node test-scripts/test-webhook.js
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Database Connection Failed**
```
❌ Error: connect ECONNREFUSED
```

**Solutions:**
- Check `DATABASE_URL` in `.env`
- Verify database is running
- Check network connectivity
- Verify credentials

#### 2. **QuickBooks API Errors**
```
❌ Error: Invalid credentials
```

**Solutions:**
- Check `QBO_CLIENT_ID` and `QBO_CLIENT_SECRET`
- Verify OAuth configuration
- Check redirect URI matches
- Ensure tokens are valid

#### 3. **Schema Validation Failed**
```
❌ Error: Table 'tokens' does not exist
```

**Solutions:**
- Run database migrations
- Check schema alignment
- Verify Supabase connection
- Update Drizzle schema

#### 4. **Webhook Test Failed**
```
❌ Error: Connection refused
```

**Solutions:**
- Check webhook URL is accessible
- Verify backend is running
- Check firewall settings
- Test with curl first

---

## 📊 Test Results Interpretation

### Success Indicators
- ✅ All database tables exist
- ✅ QuickBooks API responds correctly
- ✅ Tokens are valid and refreshable
- ✅ Webhooks receive and process requests
- ✅ Data synchronization works

### Warning Signs
- ⚠️  Some tests skipped (non-critical)
- ⚠️  Performance slower than expected
- ⚠️  Rate limits approaching

### Failure Indicators
- ❌ Database connection failed
- ❌ API authentication failed
- ❌ Schema mismatches
- ❌ Webhook endpoints unreachable

---

## 🛠️ Development Workflow

### Before Deployment
1. Run all test scripts
2. Fix any failures
3. Verify performance
4. Check logs for warnings

### After Schema Changes
1. Run `check-schema.js`
2. Run `test-db.js`
3. Verify data integrity
4. Test API endpoints

### After QuickBooks Changes
1. Run `verify-qbo-config.js`
2. Run `test-qbo-tokens.js`
3. Run `test-qbo-structure.js`
4. Test OAuth flow

---

## 📝 Adding New Tests

### Test Script Template

```javascript
import { db } from '../dist/db/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSomething() {
  try {
    console.log('🧪 Testing something...');
    
    // Your test logic here
    
    console.log('✅ Test passed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSomething();
```

### Best Practices
- Use descriptive test names
- Include setup and teardown
- Handle errors gracefully
- Provide clear output
- Exit with appropriate codes

---

## 📚 Related Documentation

- [Backend Database Guide](../db/README.md)
- [QuickBooks OAuth Setup](../../docs/QUICKBOOKS-OAUTH-SETUP.md)
- [API Documentation](../../docs/endpoints.md)
- [Deployment Guide](../../docs/DEPLOYMENT-GUIDE.md)

---

## 🆘 Support

If tests fail:

1. **Check logs:** Look for specific error messages
2. **Verify config:** Ensure all environment variables are set
3. **Test connectivity:** Use `test-db.js` first
4. **Check documentation:** See related docs above
5. **Review recent changes:** What changed since last successful run?

---

**Last Updated:** 2025-10-15  
**Location:** `/backend/test-scripts/`  
**Purpose:** Backend testing and validation
