# Supabase Webhook Configuration for QuickBooks Integration

## Overview
This document provides the exact webhook configurations needed for your Supabase project to trigger when QuickBooks data changes. You can use either HTTP requests to your backend API or Supabase Edge Functions.

## Webhook Configurations

### 1. Invoice Updates Webhook

**Name:** `WebhookForInvoiceUpdates`

**Table:** `invoices`

**Events:** 
- ✅ Insert
- ✅ Update  
- ✅ Delete

**Configuration Options:**

#### Option A: HTTP Request
```
Type: HTTP Request
Method: POST
URL: https://wemakemarin.com/api/webhooks/invoice
Timeout: 5000ms
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_WEBHOOK_SECRET
```

#### Option B: Supabase Edge Function
```
Type: Supabase Edge Functions
Function: process-invoice-webhook
```

### 2. Customer Updates Webhook

**Name:** `WebhookForCustomerUpdates`

**Table:** `customers`

**Events:**
- ✅ Insert
- ✅ Update
- ✅ Delete

**Configuration Options:**

#### Option A: HTTP Request
```
Type: HTTP Request
Method: POST
URL: https://wemakemarin.com/api/webhooks/customer
Timeout: 5000ms
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_WEBHOOK_SECRET
```

#### Option B: Supabase Edge Function
```
Type: Supabase Edge Functions
Function: process-customer-webhook
```

### 3. Item Updates Webhook

**Name:** `WebhookForItemUpdates`

**Table:** `items`

**Events:**
- ✅ Insert
- ✅ Update
- ✅ Delete

**Configuration Options:**

#### Option A: HTTP Request
```
Type: HTTP Request
Method: POST
URL: https://wemakemarin.com/api/webhooks/item
Timeout: 5000ms
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_WEBHOOK_SECRET
```

#### Option B: Supabase Edge Function
```
Type: Supabase Edge Functions
Function: process-item-webhook
```

### 4. Estimate Updates Webhook

**Name:** `WebhookForEstimateUpdates`

**Table:** `estimates`

**Events:**
- ✅ Insert
- ✅ Update
- ✅ Delete

**Configuration Options:**

#### Option A: HTTP Request
```
Type: HTTP Request
Method: POST
URL: https://wemakemarin.com/api/webhooks/estimate
Timeout: 5000ms
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_WEBHOOK_SECRET
```

#### Option B: Supabase Edge Function
```
Type: Supabase Edge Functions
Function: process-estimate-webhook
```

## Backend Webhook Endpoints

Your backend already has webhook endpoints configured at:

- `POST /api/webhooks/invoice` - Handles invoice changes
- `POST /api/webhooks/customer` - Handles customer changes  
- `POST /api/webhooks/item` - Handles item changes
- `POST /api/webhooks/estimate` - Handles estimate changes

## Edge Functions (Alternative)

If you prefer to use Supabase Edge Functions instead of HTTP requests, you'll need to create these functions:

1. `process-invoice-webhook`
2. `process-customer-webhook`
3. `process-item-webhook`
4. `process-estimate-webhook`

## Security Considerations

1. **Authentication**: Use a webhook secret in the Authorization header
2. **HTTPS Only**: Always use HTTPS URLs for webhooks
3. **Timeout**: Set appropriate timeouts (5000ms recommended)
4. **Rate Limiting**: Consider implementing rate limiting on webhook endpoints

## Testing Webhooks

After setting up the webhooks, you can test them by:

1. Making changes to QuickBooks data through your application
2. Checking the webhook logs in Supabase Dashboard
3. Monitoring your backend logs for webhook events
4. Using the test endpoints in your backend

## Next Steps

1. Choose between HTTP requests or Edge Functions
2. Configure the webhooks in Supabase Dashboard
3. Test the webhook functionality
4. Monitor webhook performance and adjust timeouts if needed
