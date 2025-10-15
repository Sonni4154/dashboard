# 🚀 Marin Pest Control Dashboard - Backend Handoff

## 📋 Project Overview

The Marin Pest Control Dashboard is a comprehensive business management system that integrates QuickBooks Online, Google Calendar, and custom scheduling features. The backend is built with Node.js, Express.js, TypeScript, and uses Supabase as the database provider.

---

## 🏗️ Architecture

### Core Technologies
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** JWT tokens
- **Process Management:** PM2
- **Reverse Proxy:** Nginx

### Project Structure
```
backend/
├── src/
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema definitions
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   └── customAuth.ts     # Custom authentication
│   ├── routes/
│   │   ├── auth.ts           # User authentication
│   │   ├── calendar.ts       # Calendar & scheduling
│   │   ├── customers.ts      # Customer management
│   │   ├── debug.ts          # Debug & monitoring
│   │   ├── estimates.ts      # Estimate management
│   │   ├── invoices.ts       # Invoice management
│   │   ├── items.ts          # Product/item management
│   │   ├── qbo-oauth.ts      # QuickBooks OAuth
│   │   ├── sync.ts           # Data synchronization
│   │   ├── tokens.ts         # Token management
│   │   ├── users.ts          # User management
│   │   └── webhook.ts        # Webhook handlers
│   ├── services/
│   │   ├── qboClient.ts      # QuickBooks API client
│   │   ├── qboTokenManager.ts # Token management
│   │   ├── syncService.ts    # Data sync service
│   │   ├── tokenRefresher.ts # Token refresh logic
│   │   ├── upserts.ts        # Data upsert operations
│   │   └── userService.ts    # User management
│   ├── utils/
│   │   ├── crypto.ts         # Encryption utilities
│   │   └── logger.ts         # Logging system
│   └── index.ts              # Main application entry
├── test-scripts/             # Testing and validation scripts
├── db/                       # Database migrations (deprecated)
├── logs/                     # Application logs
├── dist/                     # Compiled JavaScript
├── package.json              # Dependencies and scripts
├── ecosystem.config.js       # PM2 configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 🔧 Environment Configuration

### Required Environment Variables

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

#### QuickBooks Integration
```bash
QBO_CLIENT_ID=your_quickbooks_client_id
QBO_CLIENT_SECRET=your_quickbooks_client_secret
QBO_REDIRECT_URI=https://yourdomain.com/api/qbo/callback
QBO_ENV=production  # or sandbox
QBO_SCOPE=com.intuit.quickbooks.accounting
QBO_WEBHOOK_URL=https://yourdomain.com/api/webhook/quickbooks
```

#### Google Calendar Integration
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/callback
```

#### Authentication
```bash
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

#### Application
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

---

## 🗄️ Database Schema

### QuickBooks Schema (`quickbooks`)

#### Tables
- **tokens** - QuickBooks OAuth tokens
- **customers** - Customer information
- **items** - Products/services
- **invoices** - Invoice records
- **estimates** - Estimate records
- **invoice_line_items** - Invoice line items
- **estimate_line_items** - Estimate line items

### Google Calendar Schema (`google`)

#### Tables
- **calendar_events** - Calendar events
- **work_assignments** - Employee work assignments
- **employees** - Employee information
- **internal_notes** - Internal notes system
- **time_entries** - Time clock entries

### User Management Schema (`dashboard`)

#### Tables
- **users** - User accounts
- **user_sessions** - Active sessions
- **user_permissions** - Permission management

---

## 🔐 Authentication System

### JWT Token Authentication
- Tokens are issued upon successful login
- Tokens include user ID, role, and permissions
- Middleware validates tokens on protected routes
- Tokens expire after 24 hours (configurable)

### User Roles
- **admin** - Full system access
- **manager** - Management functions
- **technician** - Limited access
- **viewer** - Read-only access

### Protected Routes
All API endpoints except health checks, OAuth callbacks, and webhooks require authentication.

---

## 🔄 QuickBooks Integration

### OAuth Flow
1. User initiates connection via `/api/qbo/connect`
2. Redirected to QuickBooks authorization
3. Callback handled at `/api/qbo/callback`
4. Tokens stored in database
5. Automatic token refresh enabled

### Data Synchronization
- **Automatic:** Webhook-triggered sync
- **Manual:** API-triggered sync
- **Scheduled:** Periodic full sync
- **Entity-specific:** Sync individual data types

### Supported Entities
- Customers
- Items/Products
- Invoices
- Estimates
- Line items for invoices and estimates

---

## 📅 Calendar & Scheduling

### Google Calendar Integration
- OAuth-based calendar access
- Event synchronization
- Work assignment management
- Employee scheduling

### Work Assignment System
- Assign calendar events to employees
- Track assignment status
- Sequence management
- Notes and communication

### Time Clock System
- Employee clock in/out
- Location tracking
- Duration calculations
- Approval workflow

---

## 🚀 Deployment

### Production Setup
1. **Server Requirements:**
   - Ubuntu 20.04+ or similar
   - Node.js 18+
   - PM2 for process management
   - Nginx for reverse proxy
   - SSL certificates (Let's Encrypt)

2. **Database Setup:**
   - Supabase project configured
   - Environment variables set
   - Schema deployed

3. **Application Deployment:**
   ```bash
   # Install dependencies
   npm install --production
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Nginx Configuration
- Reverse proxy to backend
- Static file serving
- SSL termination
- Rate limiting
- Security headers

### SSL Setup
- Let's Encrypt certificates
- Automatic renewal
- HTTP to HTTPS redirect
- Security headers

---

## 📊 Monitoring & Debugging

### Health Checks
- **Basic:** `/health` - Simple health check
- **Detailed:** `/api/health` - Database connectivity
- **System:** `/api/debug/health` - Full system diagnostics

### Logging
- Application logs in `logs/` directory
- Error tracking and monitoring
- Performance metrics
- Debug information

### Debug Endpoints
- System information
- Database status
- QuickBooks connectivity
- Process monitoring
- Resource usage

---

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Build and run
npm run build
npm run dev
```

### Testing
```bash
# Run test scripts
node test-scripts/test-db.js
node test-scripts/verify-qbo-config.js
node test-scripts/test-qbo-tokens.js
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Comprehensive error handling

---

## 🛠️ Maintenance

### Regular Tasks
1. **Database Maintenance:**
   - Monitor connection pools
   - Check for slow queries
   - Backup verification

2. **Token Management:**
   - Monitor token expiration
   - Handle refresh failures
   - Re-authentication flow

3. **Log Management:**
   - Rotate log files
   - Monitor error rates
   - Performance analysis

### Troubleshooting
1. **Common Issues:**
   - Database connection failures
   - QuickBooks token expiration
   - Memory leaks
   - Performance degradation

2. **Debug Tools:**
   - Health check endpoints
   - System information
   - Log analysis
   - Process monitoring

---

## 📈 Performance

### Optimization
- Database query optimization
- Connection pooling
- Caching strategies
- Rate limiting
- Resource monitoring

### Scaling
- Horizontal scaling with PM2
- Database connection pooling
- Load balancing with Nginx
- CDN for static assets

---

## 🔒 Security

### Security Measures
- JWT token authentication
- Rate limiting
- CORS configuration
- Security headers
- Input validation
- SQL injection prevention

### Best Practices
- Regular security updates
- Environment variable protection
- Secure token storage
- Audit logging
- Access control

---

## 📚 API Documentation

### Complete API Reference
See `docs/endpoints.md` for comprehensive API documentation including:
- All available endpoints
- Request/response formats
- Authentication requirements
- Error handling
- Rate limiting

### OpenAPI Specification
- `openapi/openapi.json` - Complete API specification
- Swagger UI compatible
- Interactive documentation

---

## 🚨 Critical Notes

### Production Considerations
1. **Environment Variables:**
   - Never commit `.env` files
   - Use secure secret management
   - Rotate secrets regularly

2. **Database Security:**
   - Use connection pooling
   - Monitor for suspicious activity
   - Regular backups

3. **QuickBooks Integration:**
   - Monitor token expiration
   - Handle API rate limits
   - Implement retry logic

4. **Monitoring:**
   - Set up health checks
   - Monitor error rates
   - Track performance metrics

---

## 📞 Support

### Documentation
- API endpoints: `docs/endpoints.md`
- Deployment guide: `docs/DEPLOYMENT-GUIDE.md`
- Quick start: `docs/QUICK-START.md`

### Debugging
- Use debug endpoints for diagnostics
- Check logs for error details
- Monitor system health
- Test connections

### Maintenance
- Regular updates and patches
- Security monitoring
- Performance optimization
- Backup verification

---

**Last Updated:** 2025-10-15  
**Version:** 1.0.0  
**Maintainer:** Development Team
