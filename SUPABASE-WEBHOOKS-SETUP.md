# 🔗 Supabase Database Webhooks Setup

## **1. Database Webhooks Configuration**

### **A. QuickBooks Data Sync Webhooks**

```sql
-- Webhook for QuickBooks token updates
CREATE OR REPLACE FUNCTION notify_token_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('token_update', json_build_object(
    'id', NEW.id,
    'realm_id', NEW.realm_id,
    'is_active', NEW.is_active,
    'last_updated', NEW.last_updated
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for token updates
DROP TRIGGER IF EXISTS token_update_trigger ON quickbooks.tokens;
CREATE TRIGGER token_update_trigger
  AFTER UPDATE ON quickbooks.tokens
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_update();

-- Webhook for customer updates
CREATE OR REPLACE FUNCTION notify_customer_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('customer_update', json_build_object(
    'id', NEW.id,
    'realm_id', NEW.realm_id,
    'display_name', NEW.display_name,
    'last_updated', NEW.last_updated
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer updates
DROP TRIGGER IF EXISTS customer_update_trigger ON quickbooks.customers;
CREATE TRIGGER customer_update_trigger
  AFTER INSERT OR UPDATE ON quickbooks.customers
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_update();

-- Webhook for invoice updates
CREATE OR REPLACE FUNCTION notify_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('invoice_update', json_build_object(
    'id', NEW.id,
    'realm_id', NEW.realm_id,
    'doc_number', NEW.doc_number,
    'total_amt', NEW.total_amt,
    'status', NEW.status,
    'last_updated', NEW.last_updated
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoice updates
DROP TRIGGER IF EXISTS invoice_update_trigger ON quickbooks.invoices;
CREATE TRIGGER invoice_update_trigger
  AFTER INSERT OR UPDATE ON quickbooks.invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_update();
```

### **B. User Authentication Webhooks**

```sql
-- Webhook for user login/logout
CREATE OR REPLACE FUNCTION notify_user_auth()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('user_auth', json_build_object(
    'user_id', NEW.user_id,
    'action', TG_OP,
    'timestamp', NEW.created_at
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auth_sessions
DROP TRIGGER IF EXISTS user_auth_trigger ON public.auth_sessions;
CREATE TRIGGER user_auth_trigger
  AFTER INSERT OR UPDATE ON public.auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_auth();

-- Webhook for user profile updates
CREATE OR REPLACE FUNCTION notify_user_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('user_update', json_build_object(
    'user_id', NEW.id,
    'email', NEW.email,
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'is_active', NEW.is_active,
    'last_updated', NEW.last_updated
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user updates
DROP TRIGGER IF EXISTS user_update_trigger ON public.users;
CREATE TRIGGER user_update_trigger
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_update();
```

### **C. Calendar & Work Assignment Webhooks**

```sql
-- Webhook for calendar event updates
CREATE OR REPLACE FUNCTION notify_calendar_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('calendar_event', json_build_object(
    'id', NEW.id,
    'google_event_id', NEW.google_event_id,
    'title', NEW.title,
    'start_time', NEW.start_time,
    'end_time', NEW.end_time,
    'action', TG_OP,
    'last_updated', NEW.last_updated
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for calendar events
DROP TRIGGER IF EXISTS calendar_event_trigger ON calendar_events;
CREATE TRIGGER calendar_event_trigger
  AFTER INSERT OR UPDATE OR DELETE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_calendar_event();

-- Webhook for work assignment updates
CREATE OR REPLACE FUNCTION notify_work_assignment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('work_assignment', json_build_object(
    'id', NEW.id,
    'calendar_event_id', NEW.calendar_event_id,
    'employee_id', NEW.employee_id,
    'status', NEW.status,
    'assigned_at', NEW.assigned_at,
    'action', TG_OP
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for work assignments
DROP TRIGGER IF EXISTS work_assignment_trigger ON work_assignments;
CREATE TRIGGER work_assignment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON work_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_work_assignment();

-- Webhook for time entry updates
CREATE OR REPLACE FUNCTION notify_time_entry()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('time_entry', json_build_object(
    'id', NEW.id,
    'employee_id', NEW.employee_id,
    'clock_in', NEW.clock_in,
    'clock_out', NEW.clock_out,
    'duration_minutes', NEW.duration_minutes,
    'action', TG_OP
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for time entries
DROP TRIGGER IF EXISTS time_entry_trigger ON time_entries;
CREATE TRIGGER time_entry_trigger
  AFTER INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_time_entry();
```

## **2. Supabase Edge Functions for Webhooks**

### **A. Create Webhook Handler Function**

```typescript
// supabase/functions/webhook-handler/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, record, old_record } = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Webhook received:', { type, record, old_record })

    // Handle different webhook types
    switch (type) {
      case 'INSERT':
        await handleInsert(record, supabase)
        break
      case 'UPDATE':
        await handleUpdate(record, old_record, supabase)
        break
      case 'DELETE':
        await handleDelete(old_record, supabase)
        break
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleInsert(record: any, supabase: any) {
  console.log('Handling INSERT:', record)
  // Add your insert logic here
}

async function handleUpdate(record: any, oldRecord: any, supabase: any) {
  console.log('Handling UPDATE:', { record, oldRecord })
  // Add your update logic here
}

async function handleDelete(oldRecord: any, supabase: any) {
  console.log('Handling DELETE:', oldRecord)
  // Add your delete logic here
}
```

### **B. Deploy Edge Function**

```bash
# Deploy the webhook handler
supabase functions deploy webhook-handler --project-ref jpzhrnuchnfmagcjlorc
```

## **3. Supabase Dashboard Webhook Configuration**

### **A. Database Webhooks Setup**

1. **Go to Supabase Dashboard** → **Database** → **Webhooks**
2. **Create New Webhook** with these settings:

#### **QuickBooks Token Webhook**
- **Name**: `qb-token-updates`
- **Table**: `quickbooks.tokens`
- **Events**: `INSERT`, `UPDATE`
- **HTTP Request**:
  - **URL**: `https://jpzhrnuchnfmagcjlorc.supabase.co/functions/v1/webhook-handler`
  - **Method**: `POST`
  - **Headers**: 
    - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
    - `Content-Type: application/json`

#### **User Authentication Webhook**
- **Name**: `user-auth-updates`
- **Table**: `public.auth_sessions`
- **Events**: `INSERT`, `UPDATE`, `DELETE`
- **HTTP Request**:
  - **URL**: `https://jpzhrnuchnfmagcjlorc.supabase.co/functions/v1/webhook-handler`
  - **Method**: `POST`
  - **Headers**: 
    - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
    - `Content-Type: application/json`

#### **Calendar Events Webhook**
- **Name**: `calendar-event-updates`
- **Table**: `calendar_events`
- **Events**: `INSERT`, `UPDATE`, `DELETE`
- **HTTP Request**:
  - **URL**: `https://jpzhrnuchnfmagcjlorc.supabase.co/functions/v1/webhook-handler`
  - **Method**: `POST`
  - **Headers**: 
    - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
    - `Content-Type: application/json`

### **B. Real-time Subscriptions Setup**

```typescript
// Frontend: Subscribe to real-time updates
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jpzhrnuchnfmagcjlorc.supabase.co',
  'sb_publishable_jViFA4A2JPObUqt-AM1O_g__l99_DIJ'
)

// Subscribe to QuickBooks token updates
const tokenSubscription = supabase
  .channel('token-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'quickbooks',
    table: 'tokens'
  }, (payload) => {
    console.log('Token update:', payload)
    // Handle token updates in your app
  })
  .subscribe()

// Subscribe to user updates
const userSubscription = supabase
  .channel('user-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'users'
  }, (payload) => {
    console.log('User update:', payload)
    // Handle user updates in your app
  })
  .subscribe()

// Subscribe to calendar events
const calendarSubscription = supabase
  .channel('calendar-events')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'calendar_events'
  }, (payload) => {
    console.log('Calendar event update:', payload)
    // Handle calendar updates in your app
  })
  .subscribe()
```

## **4. Webhook Security & Authentication**

### **A. Webhook Authentication**

```typescript
// Verify webhook authenticity
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}
```

### **B. Rate Limiting**

```sql
-- Add rate limiting to webhook functions
CREATE OR REPLACE FUNCTION check_webhook_rate_limit()
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Check requests in last minute
  SELECT COUNT(*) INTO request_count
  FROM webhook_logs
  WHERE created_at > NOW() - INTERVAL '1 minute';
  
  -- Allow max 100 requests per minute
  RETURN request_count < 100;
END;
$$ LANGUAGE plpgsql;
```

## **5. Monitoring & Logging**

### **A. Webhook Logging Table**

```sql
-- Create webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
```

### **B. Webhook Health Check**

```sql
-- Function to check webhook health
CREATE OR REPLACE FUNCTION check_webhook_health()
RETURNS TABLE (
  webhook_name TEXT,
  last_success TIMESTAMP WITH TIME ZONE,
  last_error TIMESTAMP WITH TIME ZONE,
  error_count INTEGER,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wl.webhook_name,
    MAX(CASE WHEN wl.status = 'success' THEN wl.processed_at END) as last_success,
    MAX(CASE WHEN wl.status = 'error' THEN wl.processed_at END) as last_error,
    COUNT(CASE WHEN wl.status = 'error' THEN 1 END) as error_count,
    ROUND(
      COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::NUMERIC / 
      COUNT(*)::NUMERIC * 100, 2
    ) as success_rate
  FROM webhook_logs wl
  WHERE wl.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY wl.webhook_name;
END;
$$ LANGUAGE plpgsql;
```

---

**Apply these SQL commands and configure the webhooks in Supabase Dashboard to enable real-time data synchronization!** 🚀
