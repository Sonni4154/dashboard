# 🔐 Google OAuth Setup for Supabase

## 📋 Google OAuth Credentials

Your Google OAuth credentials have been configured for Supabase integration:

- **Client ID**: `842311582600-8sop0cn4ht6c49db6l4k38dcbfomr3sh.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Callback URL**: `https://jpzhrnuchnfmagcjlorc.supabase.co/auth/v1/callback`

## 🚀 Supabase Configuration

### Step 1: Configure Google OAuth in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `jpzhrnuchnfmagcjlorc`
3. **Navigate to**: Authentication → Providers
4. **Click on Google** to configure

### Step 2: Enter Google OAuth Credentials

In the Google OAuth configuration:

- **Client ID**: `842311582600-8sop0cn4ht6c49db6l4k38dcbfomr3sh.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Redirect URL**: `https://jpzhrnuchnfmagcjlorc.supabase.co/auth/v1/callback`

### Step 3: Configure Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (or create one)
3. **Navigate to**: APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID**: `842311582600-8sop0cn4ht6c49db6l4k38dcbfomr3sh.apps.googleusercontent.com`
5. **Click Edit**
6. **Add Authorized redirect URIs**:
   - `https://jpzhrnuchnfmagcjlorc.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)

## 🔧 Backend Configuration

### Update Your .env File

Update your `backend/.env` file with the new credentials:

```env
# GOOGLE OAUTH CONFIGURATION
GOOGLE_CLIENT_ID="842311582600-8sop0cn4ht6c49db6l4k38dcbfomr3sh.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GOOGLE_REDIRECT_URI="https://jpzhrnuchnfmagcjlorc.supabase.co/auth/v1/callback"
```

### Frontend Configuration

Update your `frontend/.env` file:

```env
# SUPABASE CONFIGURATION
VITE_SUPABASE_URL=https://jpzhrnuchnfmagcjlorc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🔐 Authentication Flow

### 1. Frontend Authentication

The frontend will use Supabase's built-in Google OAuth:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/dashboard'
  }
})
```

### 2. Backend Integration

The backend will receive the user information through Supabase's JWT tokens:

```javascript
// In your backend middleware
const { data: { user }, error } = await supabase.auth.getUser(jwt)

if (error || !user) {
  return res.status(401).json({ error: 'Unauthorized' })
}

// User is authenticated, proceed with request
req.user = user
```

## 🧪 Testing the Setup

### 1. Test Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Users
3. Click "Add user" → "Sign in with Google"
4. Test the OAuth flow

### 2. Test Backend Integration

```bash
# Start the backend
npm run dev

# Test the authentication endpoint
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Frontend Integration

```bash
# Start the frontend
npm run dev

# Navigate to http://localhost:5173
# Click "Sign in with Google"
# Verify the OAuth flow works
```

## 🔒 Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate secrets regularly

### 2. Supabase RLS

With RLS enabled, users can only access their own data:

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON "public"."users"
    FOR SELECT USING (auth.uid() = id);
```

### 3. JWT Token Validation

Always validate JWT tokens in your backend:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Validate JWT token
const { data: { user }, error } = await supabase.auth.getUser(token)
```

## 📱 Frontend Implementation

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Google OAuth Component

```javascript
// src/components/GoogleAuth.jsx
import { supabase } from '../lib/supabase'

export function GoogleAuth() {
  const handleGoogleAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    
    if (error) {
      console.error('Error:', error.message)
    }
  }

  return (
    <button onClick={handleGoogleAuth}>
      Sign in with Google
    </button>
  )
}
```

## 🔧 Backend Middleware

### 1. Authentication Middleware

```javascript
// middleware/auth.js
import { supabase } from '../lib/supabase.js'

export async function authenticateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
}
```

### 2. RLS Context Middleware

```javascript
// middleware/rls.js
import { setUserContext } from '../db/index.js'

export async function setRLSContext(req, res, next) {
  try {
    if (req.user?.id) {
      await setUserContext(req.user.id)
    }
    next()
  } catch (error) {
    res.status(500).json({ error: 'Failed to set RLS context' })
  }
}
```

## ✅ Verification Checklist

- [ ] Google OAuth configured in Supabase Dashboard
- [ ] Google Cloud Console redirect URIs updated
- [ ] Backend .env file updated with new credentials
- [ ] Frontend .env file configured with Supabase credentials
- [ ] RLS policies applied in Supabase
- [ ] Authentication flow tested
- [ ] Backend integration tested
- [ ] Frontend integration tested

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Check Google Cloud Console redirect URIs
2. **"Invalid client"**: Verify Client ID and Secret in Supabase
3. **"RLS policy violation"**: Check RLS policies are correctly applied
4. **"JWT token invalid"**: Verify Supabase anon key is correct

### Debug Steps:

1. Check Supabase logs in the dashboard
2. Verify environment variables are loaded
3. Test OAuth flow in Supabase dashboard
4. Check browser network tab for errors

---

**Your Google OAuth integration is now ready for Supabase!** 🚀
