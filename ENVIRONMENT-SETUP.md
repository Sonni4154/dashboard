# 🔧 Environment Variables Setup Guide

## 📁 **Environment Files Overview**

### **Backend Environment Files:**
- `backend/.env.example` - Production environment template
- `backend/env.development.example` - Development environment template

### **Frontend Environment Files:**
- `frontend/.env.example` - Production environment template  
- `frontend/env.development.example` - Development environment template

## 🚀 **Quick Setup for Deployment**

### **1. Backend Setup**
```bash
# Copy the production template
cp backend/.env.example backend/.env

# Edit the .env file with your actual values
nano backend/.env
```

### **2. Frontend Setup**
```bash
# Copy the production template
cp frontend/.env.example frontend/.env

# Edit the .env file with your actual values
nano frontend/.env
```

## 🔑 **Required Environment Variables**

### **Backend (Required)**
```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]?sslmode=require"

# Authentication (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Google OAuth (REQUIRED for Google Login)
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
```

### **Frontend (Required)**
```bash
# API Configuration (REQUIRED)
VITE_API_BASE_URL=""  # Empty for same-domain deployment

# Supabase (REQUIRED)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY="your_supabase_anon_key_here"
```

## 🛠️ **Development Setup**

### **1. Backend Development**
```bash
# Copy the development template
cp backend/env.development.example backend/.env

# Edit with your development values
nano backend/.env
```

### **2. Frontend Development**
```bash
# Copy the development template
cp frontend/env.development.example frontend/.env

# Edit with your development values
nano frontend/.env
```

## 📋 **Environment Variables Reference**

### **Backend Variables**

#### **Core (Required)**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI

#### **Optional**
- `QBO_CLIENT_ID` - QuickBooks OAuth client ID
- `QBO_CLIENT_SECRET` - QuickBooks OAuth client secret
- `GOOGLE_AI_API_KEY` - Google AI API key
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

### **Frontend Variables**

#### **Core (Required)**
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anon key

#### **Optional**
- `VITE_DEV_MODE` - Development mode flag
- `VITE_MOCK_AUTH` - Mock authentication flag
- `VITE_QBO_ENABLED` - QuickBooks integration flag
- `VITE_ENABLE_DEBUG_MODE` - Debug mode flag

## 🔒 **Security Notes**

### **Never Commit These Files:**
- `.env` (any environment file)
- `.env.local`
- `.env.production`
- Any file containing actual secrets

### **Always Commit These Files:**
- `.env.example` (template files)
- `env.development.example` (development templates)

## 🚨 **Common Issues**

### **1. Missing Environment Variables**
- Check that all required variables are set
- Verify variable names match exactly
- Ensure no typos in variable names

### **2. Database Connection Issues**
- Verify `DATABASE_URL` format is correct
- Check database credentials
- Ensure database is accessible

### **3. OAuth Issues**
- Verify redirect URIs match exactly
- Check client IDs and secrets
- Ensure OAuth providers are configured

## 📝 **Deployment Checklist**

- [ ] Copy `.env.example` to `.env`
- [ ] Set `DATABASE_URL` with correct credentials
- [ ] Set `JWT_SECRET` with secure random string
- [ ] Configure Google OAuth credentials
- [ ] Set Supabase credentials for frontend
- [ ] Test database connection
- [ ] Test OAuth flows
- [ ] Verify all API endpoints work

## 🔄 **Environment File Updates**

When updating environment files:
1. Update the `.env.example` files
2. Update this documentation
3. Test with both development and production templates
4. Ensure all required variables are documented

## 📞 **Support**

If you encounter issues with environment setup:
1. Check this documentation
2. Verify all required variables are set
3. Test database and OAuth connections
4. Check server logs for specific errors
