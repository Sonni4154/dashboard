# 🏢 Marin Pest Control Dashboard

A modern, full-stack web application for managing pest control operations with QuickBooks integration, employee scheduling, and real-time data synchronization.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![QuickBooks](https://img.shields.io/badge/QuickBooks-2CA01C?style=flat&logo=quickbooks&logoColor=white)](https://developer.intuit.com/)

---

## 🚀 Features

### 💼 QuickBooks Integration
- ✅ Full OAuth 2.0 authentication flow
- ✅ Automatic token refresh (every 30 minutes)
- ✅ Real-time data synchronization
- ✅ Multi-tenant support (multiple QB companies)
- ✅ Sync: Customers, Items, Invoices, Estimates
- ✅ Complete token lifecycle management

### 📊 Dashboard Features
- 📈 Real-time analytics and reporting
- 👥 Customer management
- 🧾 Invoice and estimate tracking
- 📦 Inventory management
- 📅 Google Calendar integration
- ⏰ Employee time tracking
- 🔔 Webhook support for real-time updates

### 🛠️ Technical Stack

**Frontend:**
- React + TypeScript
- Vite for blazing-fast builds
- TanStack Query for data fetching
- Tailwind CSS for styling
- Supabase client integration

**Backend:**
- Node.js + Express
- TypeScript for type safety
- Drizzle ORM for database operations
- PostgreSQL (Supabase)
- JWT authentication
- Rate limiting & security middleware

**Database:**
- Supabase PostgreSQL
- Schema namespaces: `quickbooks.*`, `google.*`, `dashboard.*`
- Full referential integrity
- Automated triggers for timestamps

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or pnpm
- QuickBooks Developer account
- Supabase account

### Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/dashboard.git
cd dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Configuration

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:[password]@[project].supabase.co:5432/postgres

# QuickBooks OAuth
QBO_CLIENT_ID=your_client_id
QBO_CLIENT_SECRET=your_client_secret
QBO_REDIRECT_URI=http://localhost:5000/api/qbo/callback
QBO_ENV=sandbox
QBO_SCOPE=com.intuit.quickbooks.accounting

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
```

#### Frontend (.env)
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_publishable_key

# API
VITE_API_BASE_URL=""  # Empty = same domain

# Development
VITE_DEV_MODE=true
VITE_MOCK_AUTH=true
```

---

## 🎯 Usage

### Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

### QuickBooks OAuth Setup

1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Create a new app
3. Add redirect URI: `http://localhost:5000/api/qbo/callback`
4. Copy Client ID and Client Secret to backend `.env`
5. Navigate to: `http://localhost:5000/api/qbo/connect`
6. Complete OAuth flow

### Data Synchronization

```bash
# Sync all QuickBooks data
curl -X POST http://localhost:5000/api/sync/all

# Check sync status
curl http://localhost:5000/api/sync/status

# Sync specific entity
curl -X POST http://localhost:5000/api/sync/customers
```

---

## 📚 Documentation

Comprehensive documentation is available in the docs directory:

- 📖 **[START-HERE.md](START-HERE.md)** - Quick start guide
- 🔐 **[QUICKBOOKS-OAUTH-SETUP.md](QUICKBOOKS-OAUTH-SETUP.md)** - OAuth configuration
- ✅ **[READY-FOR-TESTING.md](READY-FOR-TESTING.md)** - Testing procedures
- 🧪 **[FINAL-TESTING-CHECKLIST.md](FINAL-TESTING-CHECKLIST.md)** - Complete test suite
- 📊 **[CODEBASE-STATUS-REPORT.md](CODEBASE-STATUS-REPORT.md)** - Technical details

---

## 🗂️ Project Structure

```
dashboard/
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── db/              # Database schemas & connections
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth & security
│   │   └── utils/           # Helper functions
│   ├── logs/                # Application logs
│   └── package.json
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── supabase/                 # Database schema
│   ├── schema.sql           # Complete schema dump
│   └── config.toml          # Supabase config
│
└── docs/                     # Documentation
```

---

## 🔑 Key Features Explained

### Token Management
- **Automatic Refresh:** Tokens refresh every 30 minutes automatically
- **Expiration Tracking:** Both access and refresh token expiration monitored
- **Inactive Marking:** Expired tokens marked inactive, not deleted
- **OAuth Only:** No environment variable tokens (secure by default)

### Database Architecture
- **Schema Namespaces:** Organized by domain (`quickbooks.*`, `google.*`)
- **Multi-Tenant:** Support for multiple QuickBooks companies via `realm_id`
- **Foreign Keys:** Proper referential integrity
- **Triggers:** Automatic `last_updated` timestamp updates

### API Endpoints

#### QuickBooks
- `GET /api/qbo/connect` - Initiate OAuth
- `GET /api/qbo/callback` - OAuth callback
- `GET /api/qbo/token-status` - Check token status
- `POST /api/qbo/refresh-token` - Force token refresh

#### Data Sync
- `POST /api/sync/all` - Sync all entities
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/customers` - Sync customers only
- `POST /api/sync/items` - Sync items only

#### Entities
- `GET /api/customers` - List customers
- `GET /api/items` - List items
- `GET /api/invoices` - List invoices
- `GET /api/estimates` - List estimates

---

## 🧪 Testing

### Automated Tests
```bash
# Run connection tests
./test-qbo-connection.sh

# Manual health check
curl http://localhost:5000/health
```

### Manual Testing Checklist
See [FINAL-TESTING-CHECKLIST.md](FINAL-TESTING-CHECKLIST.md) for complete test procedures.

---

## 🚀 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Deploy dist/ folder to your hosting provider
```

### PM2 Process Manager (Recommended)

```bash
cd backend
npm run pm2:start    # Start all services
npm run pm2:status   # Check status
npm run pm2:logs     # View logs
npm run pm2:restart  # Restart services
```

---

## 🔒 Security

- ✅ Helmet.js for security headers
- ✅ CORS configured
- ✅ Rate limiting on API endpoints
- ✅ JWT authentication
- ✅ Environment variables for secrets
- ✅ No tokens in environment (OAuth only)
- ✅ Input validation
- ✅ SQL injection protection via Drizzle ORM

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👤 Author

**Spencer Reiser — Marin Pest Control**

---

## 🆘 Support

For issues and questions:
1. Check the [documentation](docs/)
2. Review [QUICKBOOKS-OAUTH-SETUP.md](QUICKBOOKS-OAUTH-SETUP.md)
3. See [troubleshooting section](READY-FOR-TESTING.md#troubleshooting)

---

## 🎯 Roadmap

### Current (v2.0.0)
- ✅ QuickBooks integration
- ✅ Token management
- ✅ Data synchronization
- ✅ Basic dashboard

### Planned
- 🔄 Advanced reporting
- 🔄 Mobile app
- 🔄 Automated invoicing
- 🔄 Route optimization
- 🔄 Customer portal

---

## ⚡ Performance

- **Token Refresh:** Automatic every 30 minutes
- **Data Sync:** Configurable (default: hourly)
- **API Response Time:** < 200ms average
- **Database:** Optimized with indexes
- **Caching:** TanStack Query on frontend

---

## 🙏 Acknowledgments

- QuickBooks API by Intuit
- Supabase for database & auth
- React & TypeScript ecosystem
- Drizzle ORM
- Express.js community

---

**Built with ❤️ for Marin Pest Control**

🐛 Keeping the Bay Area pest-free since [year]
