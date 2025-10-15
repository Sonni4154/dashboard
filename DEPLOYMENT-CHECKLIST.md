# 🚀 Deployment Checklist

## ✅ **Database Setup (COMPLETE)**
- [x] Only `DATABASE_URL` is required
- [x] Database schema is properly configured
- [x] All tables and relationships are set up

## 🔧 **Required Environment Variables**

### **Core Database (REQUIRED)**
```bash
DATABASE_URL="your_supabase_postgres_url"
```

### **Authentication (REQUIRED)**
```bash
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
```

### **Google OAuth (REQUIRED for Google Login)**
```bash
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
```

### **QuickBooks Integration (OPTIONAL)**
```bash
QBO_CLIENT_ID="your_quickbooks_client_id"
QBO_CLIENT_SECRET="your_quickbooks_client_secret"
QBO_REDIRECT_URI="https://yourdomain.com/api/qbo/callback"
```

### **Google Calendar Integration (OPTIONAL)**
```bash
GOOGLE_AI_API_KEY="your_google_ai_api_key_here"
# Calendar IDs for specific calendars
GOOGLE_CALENDAR_INSECT_CONTROL="calendar_id_here"
GOOGLE_CALENDAR_RODENT_CONTROL="calendar_id_here"
# ... other calendar IDs
```

## 🗄️ **Database Migration Required**

You need to add the Google OAuth fields to your users table. Run this SQL in your Supabase SQL editor:

```sql
-- Add Google OAuth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Make username and password_hash optional for OAuth users
ALTER TABLE users 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password_hash DROP NOT NULL;

-- Add indexes for Google OAuth
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
```

## 🔐 **Google OAuth Setup**

### **1. Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for development)
7. Copy the Client ID and Client Secret

### **2. Environment Variables**
Add these to your `.env` file:
```bash
GOOGLE_CLIENT_ID="your_actual_client_id_here"
GOOGLE_CLIENT_SECRET="your_actual_client_secret_here"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
```

## 🌐 **Supabase Configuration**

### **1. Database Setup**
- [x] Database is already configured
- [x] Only `DATABASE_URL` is needed
- [ ] Run the SQL migration above to add Google OAuth fields

### **2. Edge Functions (NOT REQUIRED)**
- No Edge Functions needed for this setup
- All authentication is handled by the backend API

### **3. Row Level Security (RLS)**
Consider enabling RLS on sensitive tables:
```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own data
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid()::text = id::text);
```

## 🚀 **Deployment Steps**

### **1. Backend Deployment**
1. Set environment variables in your hosting platform
2. Deploy the backend code
3. Test the health endpoint: `https://yourdomain.com/health`

### **2. Frontend Deployment**
1. Update frontend environment variables
2. Deploy frontend code
3. Test Google OAuth flow

### **3. Testing**
1. Test Google OAuth: `https://yourdomain.com/api/auth/google`
2. Test database connection: `https://yourdomain.com/health`
3. Test QuickBooks OAuth: `https://yourdomain.com/api/qbo/connect`

## 🔍 **Verification Checklist**

- [ ] Database connection working
- [ ] Google OAuth redirect working
- [ ] JWT token generation working
- [ ] User creation via Google OAuth working
- [ ] QuickBooks OAuth working (if configured)
- [ ] All API endpoints responding

## 🆘 **Troubleshooting**

### **Google OAuth Issues**
- Verify redirect URI matches exactly
- Check Client ID and Secret are correct
- Ensure Google APIs are enabled

### **Database Issues**
- Verify `DATABASE_URL` is correct
- Check database permissions
- Run the SQL migration for Google OAuth fields

### **Authentication Issues**
- Verify `JWT_SECRET` is set
- Check token expiration settings
- Verify user table has Google OAuth fields

## 📝 **Notes**

- The system supports both custom authentication and Google OAuth
- Users can login with either method
- Google OAuth users don't need passwords
- All authentication is handled server-side
- No Edge Functions required
