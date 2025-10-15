# 🔐 Environment Variables Reference

This directory contains up-to-date `.env` templates for both frontend and backend.

## 📁 Files

- `backend.env.example` - Backend environment variables
- `frontend.env.example` - Frontend environment variables

## 🚀 Quick Setup

### Backend

```bash
cd backend
cp ../env/backend.env.example .env
# Edit .env with your actual values
nano .env
```

### Frontend

```bash
cd frontend
cp ../env/frontend.env.example .env
# Edit .env with your actual values
nano .env
```

## 🔑 Required vs Optional Variables

### Backend - REQUIRED

These must be configured for the application to work:

- `DATABASE_URL` - Your NeonDB connection string
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `CORS_ORIGIN` - Allowed frontend origin

### Backend - REQUIRED (for QuickBooks)

- `QBO_CLIENT_ID` - From QuickBooks Developer portal
- `QBO_CLIENT_SECRET` - From QuickBooks Developer portal
- `QBO_REDIRECT_URI` - OAuth callback URL
- `QBO_REALM_ID` - Your QuickBooks company ID
- `QBO_WEBHOOK_URL` - Webhook receiver URL
- `QBO_WEBHOOK_VERIFIER_TOKEN` - Webhook verification token

### Backend - OPTIONAL

- Authentication (if using Stack Auth instead of SKIP_AUTH)
  - `STACK_AUTH_URL`
  - `STACK_PROJECT_ID`
  - `STACK_SECRET_SERVER_KEY`
  - `STACK_AUTH_AUDIENCE`

- Google Calendar Integration
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALENDAR_REFRESH_TOKEN`
  - `GOOGLE_CALENDAR_IDS`

- AI Features
  - `OPENAI_API_KEY`
  - `GOOGLE_AI_API_KEY`
  - `MISTRAL_API_KEY`

- Email (SMTP)
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`

- Other Integrations
  - `HUBSPOT_ACCESS_TOKEN`
  - `JOTFORM_API_KEY`
  - `JIBBLE_API_KEY`

### Frontend - REQUIRED

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_STACK_PROJECT_ID` - Stack Auth project ID (if using auth)
- `VITE_STACK_PUBLISHABLE_CLIENT_KEY` - Stack Auth public key (if using auth)

### Frontend - OPTIONAL

- `VITE_DEV_MODE` - Enable dev features
- `VITE_MOCK_AUTH` - Bypass authentication
- `VITE_DEBUG` - Enable debug logging
- Feature flags (CALENDAR, TIME_TRACKING, AI_FEATURES)

## ⚠️ Security Notes

1. **Never commit `.env` files** - They contain secrets
2. **Keep `.env.example` updated** - Document new variables here
3. **Use strong secrets** - `SESSION_SECRET` should be 32+ random characters
4. **Rotate tokens regularly** - Especially QB OAuth tokens
5. **Use environment-specific values** - Different tokens for dev/staging/prod

## 🔄 Updating These Templates

When adding new environment variables:

1. Add to appropriate `.env.example` file in this directory
2. Update this README with description
3. Update `docs/SETUP.md` if needed
4. Notify team members to update their local `.env` files

## 📋 Checklist for New Deployment

- [ ] Copy `backend.env.example` to `backend/.env`
- [ ] Copy `frontend.env.example` to `frontend/.env`
- [ ] Update `DATABASE_URL` with your NeonDB connection
- [ ] Complete QuickBooks OAuth flow to get valid tokens
- [ ] Update `QBO_*` variables with real values
- [ ] Set `CORS_ORIGIN` to your frontend URL
- [ ] Generate strong `SESSION_SECRET`
- [ ] Configure email SMTP settings (if using email features)
- [ ] Test backend with `cd backend && npm start`
- [ ] Test frontend with `cd frontend && npm run dev`
- [ ] Verify API connectivity: `curl http://localhost:5000/health`

