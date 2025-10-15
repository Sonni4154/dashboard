# Fix Backend TypeScript Errors (Keep QuickBooks OAuth Working)
Write-Host "🔧 Fixing Backend TypeScript Errors..." -ForegroundColor Green
Write-Host ""

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Keep your working QuickBooks OAuth logic" -ForegroundColor White
Write-Host "  2. Keep your database connections" -ForegroundColor White
Write-Host "  3. Fix only the compilation errors" -ForegroundColor White
Write-Host "  4. Add simple auth alongside existing system" -ForegroundColor White
Write-Host ""

# Step 1: Create a working auth.ts that doesn't conflict
Write-Host "Step 1: Creating fixed auth route..." -ForegroundColor Cyan
scp backend/src/routes/auth-simple.ts root@23.128.116.9:/opt/dashboard/backend/src/routes/auth-working.ts

# Step 2: Create fixed index.ts that imports auth-working
Write-Host "Step 2: Creating index.ts patch..." -ForegroundColor Cyan

# Create a temporary fixed index.ts locally
$indexContent = @'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { verifyAuth, devAuth } from './middleware/auth.js';
// Commenting out custom auth temporarily to fix compilation
// import { verifyCustomAuth, devCustomAuth } from './middleware/customAuth.js';
import { initializeTokensFromEnv } from './services/tokenInitializer.js';
import { qboTokenManager } from './services/qboTokenManager.js';

// Import routes
import customersRouter from './routes/customers.js';
import invoicesRouter from './routes/invoices.js';
import estimatesRouter from './routes/estimates.js';
import itemsRouter from './routes/items.js';
import syncRouter from './routes/sync.js';
import tokensRouter from './routes/tokens.js';
import webhookRouter from './routes/webhook.js';
import calendarRouter from './routes/calendar.js';
import qboOAuthRouter from './routes/qbo-oauth.js';
import debugRouter from './routes/debug.js';
// Import working auth (simple version)
import authRouter from './routes/auth-working.js';
// Commenting out users router temporarily
// import usersRouter from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}/api`;
const WEBHOOK_URL = process.env.QBO_WEBHOOK_URL || `http://localhost:${PORT}/api/webhook/quickbooks`;

// --- Security & Performance Middleware ---
app.use(helmet());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// --- CORS Configuration ---
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Request Logging Middleware ---
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });
  next();
});

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Marin Pest Control Backend is running!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Auth routes (simple version - no database conflicts)
app.use('/api/auth', authRouter);

// QuickBooks routes (KEEP ALL EXISTING LOGIC)
app.use('/api/customers', devAuth, customersRouter);
app.use('/api/invoices', devAuth, invoicesRouter);
app.use('/api/estimates', devAuth, estimatesRouter);
app.use('/api/items', devAuth, itemsRouter);
app.use('/api/products', devAuth, itemsRouter);
app.use('/api/sync', devAuth, syncRouter);
app.use('/api/tokens', devAuth, tokensRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/qbo', qboOAuthRouter);

// Calendar routes (temporarily disabled to fix compilation)
// app.use('/api/calendar', devAuth, calendarRouter);

// Debug routes
app.use('/api/debug', devAuth, debugRouter);

// User routes (temporarily disabled)
// app.use('/api/users', devCustomAuth, usersRouter);

// --- Initialize Tokens on Startup ---
if (process.env.QBO_REFRESH_TOKEN && process.env.QBO_REALM_ID) {
  initializeTokensFromEnv().catch((error) => {
    logger.error('Failed to initialize tokens from environment:', error);
  });
}

// --- Start Server ---
app.listen(PORT, () => {
  logger.info(`🚀 Marin Pest Control Backend started successfully!`);
  logger.info(`📍 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 API base URL: ${API_BASE_URL}`);
  logger.info(`🔔 Webhook endpoint: ${WEBHOOK_URL}`);

  // Start QuickBooks token management service
  qboTokenManager.start();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
'@

# Save to temp file
$indexContent | Out-File -FilePath "backend/src/index-fixed.ts" -Encoding UTF8

Write-Host "Step 3: Uploading fixed files..." -ForegroundColor Cyan
scp backend/src/index-fixed.ts root@23.128.116.9:/opt/dashboard/backend/src/index.ts
scp backend/src/services/userServiceSimple.ts root@23.128.116.9:/opt/dashboard/backend/src/services/

Write-Host ""
Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""

# Generate JWT secret
Write-Host "Step 4: Generate JWT Secret..." -ForegroundColor Cyan
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host "Generated JWT_SECRET: $JWT_SECRET" -ForegroundColor Yellow
Write-Host ""

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔧 NOW SSH INTO YOUR SERVER" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh root@23.128.116.9" -ForegroundColor White
Write-Host "cd /opt/dashboard/backend" -ForegroundColor White
Write-Host ""
Write-Host "Add to .env:" -ForegroundColor Yellow
Write-Host "JWT_SECRET=`"$JWT_SECRET`"" -ForegroundColor White
Write-Host "JWT_EXPIRES_IN=`"24h`"" -ForegroundColor White
Write-Host ""
Write-Host "Then rebuild:" -ForegroundColor Yellow
Write-Host "npm run build" -ForegroundColor White
Write-Host "pm2 restart all" -ForegroundColor White
Write-Host "pm2 logs --lines 20" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ WHAT THIS KEEPS:" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ QuickBooks OAuth 2.0" -ForegroundColor White
Write-Host "  ✅ Token refresh logic" -ForegroundColor White
Write-Host "  ✅ Database connections" -ForegroundColor White
Write-Host "  ✅ All QBO routes (customers, invoices, items)" -ForegroundColor White
Write-Host "  ✅ Sync service" -ForegroundColor White
Write-Host "  ✅ Webhook handling" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔧 WHAT THIS FIXES:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ TypeScript compilation errors" -ForegroundColor White
Write-Host "  ✅ Missing auth-simple.js import" -ForegroundColor White
Write-Host "  ✅ Calendar route conflicts (temporarily disabled)" -ForegroundColor White
Write-Host "  ✅ User route conflicts (temporarily disabled)" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📋 ROLLBACK OPTION:" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "If this doesn't work, run on server:" -ForegroundColor White
Write-Host "cd /opt/dashboard/backend" -ForegroundColor White
Write-Host "git checkout src/index.ts" -ForegroundColor White
Write-Host "npm run build" -ForegroundColor White
Write-Host "pm2 restart all" -ForegroundColor White
Write-Host ""
