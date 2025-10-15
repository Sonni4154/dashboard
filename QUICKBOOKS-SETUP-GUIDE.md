# 🚀 QUICKBOOKS SETUP GUIDE

## **📋 OVERVIEW**

This guide will help you get a QuickBooks token and sync your database with QuickBooks data.

## **🔧 PREREQUISITES**

1. **✅ Server Running** - Backend is running on `http://localhost:5000`
2. **✅ Database Connected** - Supabase PostgreSQL is connected
3. **✅ Environment Variables** - QuickBooks OAuth credentials are set

## **🔑 QUICKBOOKS OAUTH SETUP**

### **Step 1: Get QuickBooks OAuth Credentials**

1. Go to [Intuit Developer Dashboard](https://developer.intuit.com/)
2. Create a new app or use existing app
3. Get your credentials:
   - **Client ID** → `QBO_CLIENT_ID`
   - **Client Secret** → `QBO_CLIENT_SECRET`
   - **Redirect URI** → `http://localhost:5000/api/qbo-oauth/callback`

### **Step 2: Update Environment Variables**

Update your `backend/.env` file:

```bash
# QuickBooks OAuth Configuration
QBO_CLIENT_ID=your_client_id_here
QBO_CLIENT_SECRET=your_client_secret_here
QBO_REDIRECT_URI=http://localhost:5000/api/qbo-oauth/callback
QBO_SCOPE=com.intuit.quickbooks.accounting

# Database Configuration
DATABASE_URL=your_supabase_database_url
```

### **Step 3: Start QuickBooks OAuth Flow**

1. **Open your browser** and go to:
   ```
   http://localhost:5000/api/qbo-oauth/authorize
   ```

2. **You'll be redirected to QuickBooks** to authorize the app

3. **After authorization**, you'll be redirected back to:
   ```
   http://localhost:5000/api/qbo-oauth/callback
   ```

4. **The token will be saved** to your database automatically

## **🔄 SYNC QUICKBOOKS DATA**

### **Step 1: Test Token Status**

Check if your token is valid:
```bash
curl http://localhost:5000/api/tokens/status
```

### **Step 2: Sync Data**

Sync all QuickBooks data to your database:
```bash
curl -X POST http://localhost:5000/api/sync/trigger
```

### **Step 3: Verify Data**

Check if data was synced:
```bash
# Check customers
curl http://localhost:5000/api/customers

# Check items
curl http://localhost:5000/api/items

# Check invoices
curl http://localhost:5000/api/invoices
```

## **🔍 TROUBLESHOOTING**

### **Common Issues:**

1. **"Invalid redirect URI"**
   - Make sure redirect URI in QuickBooks app matches exactly
   - Check for trailing slashes or HTTP vs HTTPS

2. **"Token expired"**
   - Run the OAuth flow again to get a new token
   - Check if token refresh is working

3. **"Database connection failed"**
   - Verify `DATABASE_URL` is correct
   - Check if Supabase is accessible

4. **"Sync failed"**
   - Check if token is valid and not expired
   - Verify QuickBooks company is connected

### **Debug Commands:**

```bash
# Check server health
curl http://localhost:5000/health

# Check token status
curl http://localhost:5000/api/tokens/status

# Check database connection
curl http://localhost:5000/api/debug/db

# Check QuickBooks connection
curl http://localhost:5000/api/debug/qbo
```

## **📊 EXPECTED DATA**

After successful sync, you should see:

- **Customers** - All QuickBooks customers
- **Items** - All products/services
- **Invoices** - All invoices with line items
- **Estimates** - All estimates with line items
- **Companies** - Company information

## **🚀 NEXT STEPS**

1. **Test OAuth Flow** - Get your first token
2. **Sync Data** - Pull all QuickBooks data
3. **Test API Endpoints** - Verify data is accessible
4. **Set up Webhooks** - For real-time updates
5. **Deploy to Production** - When ready

## **📝 NOTES**

- **Tokens expire** after 1 hour and need refresh
- **Sync is one-way** (QuickBooks → Database)
- **Webhooks** can provide real-time updates
- **Rate limits** apply to QuickBooks API calls
