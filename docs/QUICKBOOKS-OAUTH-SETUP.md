# QuickBooks OAuth Setup & Testing Guide

## 🎯 Prerequisites

1. **QuickBooks Developer Account**
   - Sign up at https://developer.intuit.com
   - Create an app in the Intuit Developer Portal

2. **Required Environment Variables**
   Add these to your `backend/.env` file:
   ```env
   QBO_CLIENT_ID=your_client_id_here
   QBO_CLIENT_SECRET=your_client_secret_here
   QBO_REDIRECT_URI=http://localhost:5000/api/qbo/callback
   QBO_ENV=sandbox  # or 'production'
   QBO_SCOPE=com.intuit.quickbooks.accounting
   ```

---

## 🔧 OAuth Flow Endpoints

### 1. **Initiate Connection**
```
GET /api/qbo/connect
```
- Redirects user to QuickBooks authorization page
- User selects their QuickBooks company
- User approves permissions

### 2. **Handle Callback**
```
GET /api/qbo/callback
```
- Automatically called by QuickBooks after authorization
- Exchanges authorization code for tokens
- Saves tokens to database
- Shows success page

### 3. **Disconnect**
```
GET /api/qbo/disconnect
```
- Removes tokens from database
- Disconnects QuickBooks integration

---

## 📊 What Gets Stored in Database

When OAuth succeeds, the following is saved to `quickbooks.tokens`:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique token ID | `1729000000000` (timestamp) |
| `realm_id` | QuickBooks company ID | `9130354674010826` |
| `access_token` | API access token | `eyJenc...` (JWT) |
| `refresh_token` | Token to get new access token | `AB11...` |
| `token_type` | Always "Bearer" | `Bearer` |
| `scope` | API permissions granted | `com.intuit.quickbooks.accounting` |
| `expires_at` | When access token expires | `2025-10-15 15:30:00+00` (1 hour) |
| `refresh_token_expires_at` | When refresh expires | `2026-01-23 14:30:00+00` (~100 days) |
| `environment` | Sandbox or production | `sandbox` or `production` |
| `is_active` | Whether token is active | `true` |
| `created_at` | When token was created | `2025-10-15 14:30:00+00` |
| `last_updated` | Last update time | `2025-10-15 14:30:00+00` |

---

## 🧪 Testing the OAuth Flow

### Option 1: Direct Browser Test
1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Open your browser to:
   ```
   http://localhost:5000/api/qbo/connect
   ```

3. You'll be redirected to QuickBooks
4. Select a test company (in Sandbox mode)
5. Click "Connect"
6. You'll be redirected back with a success message

### Option 2: Test with Supabase
```sql
-- Check if tokens were saved
SELECT 
  id,
  realm_id,
  environment,
  is_active,
  expires_at,
  refresh_token_expires_at,
  created_at
FROM quickbooks.tokens
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;
```

### Option 3: Test Token Manager
After OAuth succeeds, test the token manager:

```bash
# Check token status
curl http://localhost:5000/api/qbo/token-status

# Force a token refresh
curl -X POST http://localhost:5000/api/qbo/refresh-token
```

---

## 🔄 Token Lifecycle

### 1. **Initial Authorization**
- User clicks "Connect QuickBooks"
- OAuth flow completes
- Tokens saved to database
- `is_active = true`

### 2. **Automatic Refresh** (Token Manager)
- Runs every 30 minutes
- Checks if access token expires within 10 minutes
- Automatically refreshes using refresh token
- Updates `access_token`, `expires_at`, and `last_updated`

### 3. **Token Expiration**
- **Access Token:** Expires after 1 hour
  - Auto-refreshed by token manager
  - Also refreshed on-demand when API calls fail
  
- **Refresh Token:** Expires after ~100 days
  - If expired, user must re-authorize (OAuth flow again)
  - Token manager sets `is_active = false`

### 4. **Reauthorization**
When refresh token expires:
1. Token manager sets `is_active = false`
2. User sees "Please reconnect QuickBooks" message
3. User clicks "Connect QuickBooks" again
4. New OAuth flow creates new token entry
5. Old tokens remain in database but `is_active = false`

---

## 🚨 Common Issues & Solutions

### Issue: "Client ID not configured"
**Solution:** Make sure `QBO_CLIENT_ID` is in your `.env` file

### Issue: "redirect_uri_mismatch"
**Solution:** 
1. Go to your Intuit Developer app settings
2. Add your redirect URI: `http://localhost:5000/api/qbo/callback`
3. Make sure `QBO_REDIRECT_URI` in `.env` matches exactly

### Issue: "Token expired" immediately
**Solution:** 
- Check your server's system time
- Make sure timezone handling is correct
- Verify `expires_in` from QuickBooks response

### Issue: "Invalid grant" when refreshing
**Solution:**
- Refresh token may be expired
- Re-run OAuth flow to get new tokens
- Check that `refresh_token` is being saved correctly

### Issue: Database connection errors
**Solution:**
- Verify `DATABASE_URL` in `.env`
- Test connection: `SELECT 1` query
- Check Supabase connection limits

---

## 📝 Environment Setup Checklist

- [ ] QuickBooks Developer account created
- [ ] App created in Intuit Developer Portal
- [ ] Redirect URI configured in app settings
- [ ] `QBO_CLIENT_ID` added to `.env`
- [ ] `QBO_CLIENT_SECRET` added to `.env`
- [ ] `QBO_REDIRECT_URI` added to `.env`
- [ ] `QBO_ENV` set to `sandbox` or `production`
- [ ] `DATABASE_URL` configured for Supabase
- [ ] Backend server running on correct port
- [ ] Token manager service started

---

## 🎉 Success Indicators

You'll know OAuth is working when:

1. ✅ Redirect to QuickBooks works
2. ✅ Can select test company
3. ✅ Callback returns success page
4. ✅ Tokens appear in `quickbooks.tokens` table
5. ✅ Token status endpoint returns valid status
6. ✅ Token manager auto-refreshes tokens
7. ✅ QuickBooks API calls work (customers, items, etc.)

---

## 🔍 Debugging

### Enable detailed logging:
```typescript
// In qboTokenManager.ts
logger.info('Token check result:', { /* details */ });
logger.error('Token refresh failed:', error);
```

### Check token status anytime:
```bash
curl http://localhost:5000/api/qbo/token-status
```

### Manually test QuickBooks API:
```bash
# Get company info
curl http://localhost:5000/api/debug/company-info

# Sync all data
curl -X POST http://localhost:5000/api/sync/all
```

---

## 📚 Resources

- [QuickBooks OAuth 2.0 Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [Intuit Developer Portal](https://developer.intuit.com/)
- [QuickBooks API Explorer](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [Token Management Best Practices](https://developer.intuit.com/app/developer/qbo/docs/learn/rest-api-features)

---

**Last Updated:** 2025-10-15
**Status:** ✅ OAuth flow updated and ready for testing

