# 🔄 Reconnect QuickBooks

**Issue:** Token expired at 13:54:24 UTC (6 hours ago)  
**Status:** Refresh token is still valid until Jan 2026  
**Solution:** Manually reconnect or trigger token refresh

---

## 🚀 Option 1: Reconnect via Browser (Recommended - 2 minutes)

1. **Go to:** https://www.wemakemarin.com/api/qbo/connect

2. **Authorize QuickBooks** - You'll be redirected to Intuit to authorize

3. **Done!** The new token will be saved and auto-refresh will work again

---

## 🔧 Option 2: Check Auto-Refresh Status

The backend should auto-refresh every 30 minutes. Let me check if it's running:

```bash
# On your server
pm2 logs --lines 50

# Look for:
# "QuickBooks token refreshed successfully"
# or
# "Failed to refresh QuickBooks token"
```

If you see errors, the token might be invalid. Use Option 1 to reconnect.

---

## 🧪 Option 3: Manual Token Refresh (On Server)

```bash
ssh root@23.128.116.9

# Check current token status
curl http://localhost:5000/api/tokens

# The response will show if token is expired

# If the refresh token is valid, restart PM2 to trigger refresh
pm2 restart all

# Wait 5 seconds
sleep 5

# Check logs
pm2 logs --lines 20

# Look for "QuickBooks token refreshed successfully"
```

---

## ✅ After Reconnecting

Once the token is refreshed, run the sync:

```bash
curl -X POST http://localhost:5000/api/sync
```

This will populate all the pricing data for products!

---

## 🎯 Quick Test

```bash
# Check if token is working
curl http://localhost:5000/api/tokens

# Should show:
# "isValid": true
# "expiresIn": ... (minutes until expiration)
```

---

**Recommended:** Use Option 1 (browser reconnect) - it's the fastest and most reliable! 🚀
