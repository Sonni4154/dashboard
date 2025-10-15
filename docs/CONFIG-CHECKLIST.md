# ⚙️ Configuration Checklist
**Critical Files to Keep Updated**

---

## 📋 When to Update This Checklist

Update these files whenever you:
- Add new environment variables
- Change database schema
- Modify build processes
- Update dependencies
- Change server configuration
- Add new features that require config

---

## 🗂️ Configuration Files by Priority

### 🔴 CRITICAL (Will Break if Wrong)

#### 1. Environment Variables

**Location:** `/env/`
- `backend.env.example` - Backend environment template
- `frontend.env.example` - Frontend environment template
- `README.md` - Documentation for all variables

**When to Update:**
- Adding new API integrations
- Changing authentication providers
- Adding feature flags
- Modifying server ports or URLs

**Dependencies:**
- Backend `.env` must match `backend/src/index.ts` expectations
- Frontend `.env` must have `VITE_` prefix for all vars

---

#### 2. Database Schema

**Location:** `backend/src/db/schema.ts`

**Current Schema Tables:**
- `quickbooks.customers` (bigint ID, QB field names)
- `quickbooks.invoices` (bigint ID, QB field names)
- `quickbooks.estimates` (bigint ID)
- `quickbooks.items` (bigint ID)
- `quickbooks.tokens` (bigint ID)
- `quickbooks.invoice_line_items`
- `quickbooks.estimate_line_items`

**When to Update:**
- Adding new QuickBooks entities
- Adding custom tables (schedules, notes, etc.)
- Changing field types
- Adding indexes

**Dependencies:**
- Must match actual NeonDB schema
- Routes in `backend/src/routes/` must use matching field names
- Upsert functions in `backend/src/services/upserts.ts` must match

---

#### 3. Nginx Configuration

**Location:** `backend/nginx/wemakemarin.conf`

**Subdomains:**
- `wemakemarin.com` → Frontend (port 3000 dev / static files prod)
- `api.wemakemarin.com` → Backend API (port 5000)
- `webhook.wemakemarin.com` → QuickBooks webhooks (port 5000/api/webhook)
- `admin.wemakemarin.com` → Admin panel

**When to Update:**
- Changing ports
- Adding new subdomains
- Modifying proxy settings
- Adjusting rate limits
- Changing SSL settings

**Deploy Command:**
```bash
sudo cp /opt/dashboard/backend/nginx/wemakemarin.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/wemakemarin.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

#### 4. PM2 Ecosystem

**Location:** `backend/ecosystem.config.cjs`

**Current Apps:**
- `marin-pest-control-backend` (main API)
- `marin-pest-control-token-refresher` (QB token refresh)
- `marin-pest-control-sync-service` (hourly sync)

**When to Update:**
- Adding new background services
- Changing memory limits
- Modifying restart policies
- Updating environment variables

**Note:** File must be `.cjs` because `backend/package.json` has `"type": "module"`

---

### 🟡 IMPORTANT (Will Cause Issues if Outdated)

#### 5. Package Dependencies

**Locations:**
- `backend/package.json`
- `frontend/package.json`
- `package.json` (root)

**Key Dependencies to Monitor:**
- `drizzle-orm` - Database ORM
- `@neondatabase/serverless` - DB driver
- `axios` - HTTP client
- `express` - Backend framework
- `@tanstack/react-query` - Frontend data fetching
- `wouter` - Frontend routing

**Update Command:**
```bash
npm outdated
npm update
npm audit fix
```

**When to Update:**
- Security vulnerabilities
- Breaking changes in major versions
- New features needed
- Performance improvements

---

#### 6. TypeScript Configuration

**Locations:**
- `backend/tsconfig.json`
- `frontend/tsconfig.json`
- `frontend/tsconfig.node.json`

**Critical Settings:**
- Backend: `"type": "module"` in package.json (ES modules)
- Frontend: Path aliases (`@/*` → `./src/*`)
- Both: Strict mode disabled for rapid development (can enable later)

**When to Update:**
- Changing module system
- Adding path aliases
- Enabling stricter type checking
- Adding new lib directories

---

#### 7. Vite Configuration

**Location:** `frontend/vite.config.ts`

**Current Settings:**
- Dev server on port 3000
- Path alias: `@` → `./src`
- Build output: `dist/`

**When to Update:**
- Changing ports
- Adding build optimizations
- Configuring proxies
- Adding plugins

---

#### 8. Drizzle Kit Configuration

**Location:** `backend/drizzle.config.ts`

**Current Settings:**
- Schema: `./src/db/schema.ts`
- Migrations: `./drizzle/migrations`
- Dialect: `postgresql`
- DB: Uses `DATABASE_URL` from `.env`

**When to Update:**
- Moving schema files
- Changing migration strategy
- Updating database connection

**Commands:**
```bash
npm run db:generate  # Generate migrations
npm run db:push      # Push to database
npm run db:studio    # Open Drizzle Studio
```

---

### 🟢 NICE TO HAVE (For Better DX)

#### 9. ESLint Configuration

**Status:** Basic config in `backend/package.json`

**When to Update:**
- Enforcing code style
- Adding custom rules
- Integrating with CI/CD

---

#### 10. Git Ignore

**Location:** `.gitignore`

**Must Ignore:**
- `node_modules/`
- `dist/`
- `.env`
- `*.log`
- `.DS_Store`

---

## 🔍 Pre-Deployment Verification

Run these checks before deploying:

```bash
# 1. Check environment files exist
ls backend/.env frontend/.env

# 2. Verify database connection
cd backend && npm run check

# 3. Test TypeScript compilation
cd backend && npm run build
cd ../frontend && npm run build

# 4. Verify nginx config
sudo nginx -t

# 5. Check PM2 ecosystem
cd backend && pm2 start ecosystem.config.cjs

# 6. Test health endpoint
curl http://localhost:5000/health

# 7. Test API endpoints
curl http://localhost:5000/api/customers
```

---

## 📝 Change Log Format

When updating config files, add to `docs/changes.log`:

```
[DATE] - [FILE] - [CHANGE]
Example:
2025-10-07 - backend.env.example - Added GOOGLE_CALENDAR_REFRESH_TOKEN
2025-10-07 - nginx/wemakemarin.conf - Updated rate limits for webhook endpoint
2025-10-07 - package.json - Updated drizzle-orm to 0.44.6
```

---

## 🚨 Common Gotchas

1. **ES Modules**: Backend uses `"type": "module"`, so:
   - Use `.cjs` for CommonJS files (like ecosystem.config)
   - Use `import` not `require`
   - File extensions required in imports (`.js`)

2. **Drizzle ORM**: 
   - Schema must match actual database exactly
   - Use `{ mode: 'number' }` for bigint to get JS numbers
   - Relations must match foreign keys

3. **Nginx**:
   - Test config before reloading: `sudo nginx -t`
   - Webhook subdomain must NOT be Cloudflare-proxied
   - Update both HTTP (80) and HTTPS (443) blocks

4. **Environment Variables**:
   - Frontend vars need `VITE_` prefix
   - Quote strings with special characters
   - Use `dotenv/config` for ES modules

5. **PM2**:
   - Save after changes: `pm2 save`
   - Update env: `pm2 restart all --update-env`
   - Check logs: `pm2 logs`

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Initial setup guide
- [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md) - Current status
- [backend_handoff.md](./backend_handoff.md) - Backend architecture
- [endpoints.md](./endpoints.md) - API endpoints reference

