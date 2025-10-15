import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { verifyAuth, devAuth } from './middleware/auth.js';
import { verifyCustomAuth, devCustomAuth } from './middleware/customAuth.js';
import { responseEnvelope, errorHandler } from './middleware/responseEnvelope.js';
import { devAdminAuth } from './middleware/adminAuth.js';
// RLS context now handled natively by Supabase
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
import authRouter from './routes/auth.js';
import googleOAuthRouter from './routes/google-oauth.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import v1Router from './routes/v1.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required when behind nginx
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response envelope middleware
app.use(responseEnvelope);

// RLS context now handled natively by Supabase auth

// Request logging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Log suspicious user agents
  if (userAgent.includes('Android') || userAgent.includes('bot') || userAgent.includes('crawler')) {
    logger.warn(`Suspicious user agent detected: ${userAgent}`, {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  }
  
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: userAgent,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Root route - redirect to frontend
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Health check endpoints (no auth required)
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { db } = await import('./db/index.js');
    await db.execute('SELECT 1');
    
    res.json({
      success: true,
      ok: true,
      message: 'Marin Pest Control Backend is healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      ok: false,
      message: 'Backend is running but database connection failed',
      error: error.message,
    });
  }
});

// Also respond to /api/health
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { db } = await import('./db/index.js');
    await db.execute('SELECT 1');
    
    res.json({
      success: true,
      ok: true,
      message: 'Marin Pest Control Backend is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      ok: false,
      message: 'Backend is running but database connection failed',
      error: error.message,
    });
  }
});

// Webhook endpoints (no auth required)
app.use('/api/webhook', webhookRouter);

// QuickBooks OAuth endpoints (no auth required for initial connection)
app.use('/api/qbo', qboOAuthRouter);

    // Authentication endpoints (no auth required for login/register)
    app.use('/api/auth', authRouter);
    app.use('/api/auth', googleOAuthRouter);

// Protected API routes (require authentication)
app.use('/api/customers', devAuth, customersRouter);
app.use('/api/invoices', devAuth, invoicesRouter);
app.use('/api/estimates', devAuth, estimatesRouter);
app.use('/api/items', devAuth, itemsRouter);
app.use('/api/sync', devAuth, syncRouter);
app.use('/api/tokens', devAuth, tokensRouter);

// Calendar, scheduling, and employee routes
app.use('/api/calendar', devAuth, calendarRouter);
app.use('/api/work-queue', devAuth, calendarRouter); // Work queue for team dashboard
app.use('/api/employees', devAuth, calendarRouter); // Nested in calendar router
app.use('/api/assignments', devAuth, calendarRouter); // Nested in calendar router
app.use('/api/notes', devAuth, calendarRouter); // Nested in calendar router
app.use('/api/clock', devAuth, calendarRouter); // Nested in calendar router

// User management routes (require authentication)
app.use('/api/users', devCustomAuth, usersRouter);

// Debug and admin routes (require authentication)
app.use('/api/debug', devAuth, debugRouter);

    // Admin routes (require admin authentication)
    app.use('/api/v1/admin', devAdminAuth, adminRouter);

// Versioned API routes (aliases to existing endpoints)
app.use('/api/v1', v1Router);

// Auth verification endpoint
app.get('/api/auth/verify', verifyAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: (req as any).user,
    timestamp: new Date().toISOString(),
  });
});

// QuickBooks token status endpoint
app.get('/api/qbo/token-status', devAuth, async (req, res) => {
  try {
    const status = await qboTokenManager.getTokenStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting token status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token status'
    });
  }
});

// Force token refresh endpoint
app.post('/api/qbo/refresh-token', devAuth, async (req, res) => {
  try {
    const success = await qboTokenManager.forceRefresh();
    res.json({
      success,
      message: success ? 'Token refreshed successfully' : 'Token refresh failed'
    });
  } catch (error) {
    logger.error('Error forcing token refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
  });
});

// Global error handler
app.use(errorHandler);

// Initialize server
async function startServer() {
  try {
    // Start QuickBooks token management service (skip if disabled)
    // Note: Tokens should only be created via OAuth flow at /api/qbo/connect
    if (process.env.SKIP_QB_TOKEN_MANAGER !== 'true') {
      logger.info('🔄 Starting QuickBooks token management service...');
      await qboTokenManager.start();
    } else {
      logger.warn('⚠️  QuickBooks token manager disabled via SKIP_QB_TOKEN_MANAGER');
    }

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Marin Pest Control Backend started successfully!`);
      logger.info(`📍 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 API base URL: http://localhost:${PORT}/api`);
      logger.info(`🔔 Webhook endpoint: http://localhost:${PORT}/api/webhook/quickbooks`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🔓 Auth verification: http://localhost:${PORT}/api/auth/verify`);
        logger.info(`📋 Webhook health: http://localhost:${PORT}/api/webhook/health`);
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
