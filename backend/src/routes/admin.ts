import { Router, Request, Response } from 'express';
import { db, tokens, customers, items, invoices, estimates } from '../db/index.js';
import { count, desc, eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/admin/tenants
 * Get tenant information (admin only)
 */
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    // Get basic tenant info from tokens
    const [activeToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.is_active, true))
      .orderBy(desc(tokens.last_updated))
      .limit(1);

    if (!activeToken) {
      return res.json({
        success: true,
        data: {
          tenants: [],
          message: 'No active QuickBooks connection found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        tenants: [{
          realmId: activeToken.realm_id,
          environment: activeToken.environment,
          lastUpdated: activeToken.last_updated,
          isActive: activeToken.is_active,
        }],
      },
    });
  } catch (error: any) {
    logger.error('Error fetching tenant info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant information',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/token-audit
 * Get token audit information (admin only)
 */
router.get('/token-audit', async (req: Request, res: Response) => {
  try {
    const allTokens = await db
      .select()
      .from(tokens)
      .orderBy(desc(tokens.created_at));

    const tokenAudit = allTokens.map(token => ({
      id: token.id,
      realmId: token.realm_id,
      environment: token.environment,
      isActive: token.is_active,
      createdAt: token.created_at,
      lastUpdated: token.last_updated,
      expiresAt: token.expires_at,
      refreshTokenExpiresAt: token.refresh_token_expires_at,
      hasAccessToken: !!token.access_token,
      hasRefreshToken: !!token.refresh_token,
    }));

    res.json({
      success: true,
      data: {
        tokens: tokenAudit,
        totalTokens: tokenAudit.length,
        activeTokens: tokenAudit.filter(t => t.isActive).length,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching token audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token audit',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/webhook-events
 * Get webhook events backlog (admin only)
 */
router.get('/webhook-events', async (req: Request, res: Response) => {
  try {
    // This would require a webhook_events table to track webhook history
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        events: [],
        totalEvents: 0,
        pendingEvents: 0,
        failedEvents: 0,
        message: 'Webhook events tracking not yet implemented',
      },
    });
  } catch (error: any) {
    logger.error('Error fetching webhook events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook events',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/health/full
 * Get comprehensive system health (admin only)
 */
router.get('/health/full', async (req: Request, res: Response) => {
  try {
    // Database health
    const [customerCount] = await db.select({ count: count() }).from(customers);
    const [itemCount] = await db.select({ count: count() }).from(items);
    const [invoiceCount] = await db.select({ count: count() }).from(invoices);
    const [estimateCount] = await db.select({ count: count() }).from(estimates);

    // Token health
    const [activeToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.is_active, true))
      .orderBy(desc(tokens.last_updated))
      .limit(1);

    const health = {
      database: {
        connected: true,
        recordCounts: {
          customers: customerCount?.count || 0,
          items: itemCount?.count || 0,
          invoices: invoiceCount?.count || 0,
          estimates: estimateCount?.count || 0,
        },
      },
      quickbooks: {
        connected: !!activeToken,
        realmId: activeToken?.realm_id || null,
        environment: activeToken?.environment || null,
        tokenExpiresAt: activeToken?.expires_at || null,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    logger.error('Error fetching full health status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health status',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/debug/system
 * Get detailed system information (admin only)
 */
router.get('/debug/system', async (req: Request, res: Response) => {
  try {
    const systemInfo = {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
        qboClientId: process.env.QBO_CLIENT_ID ? 'configured' : 'not configured',
        qboClientSecret: process.env.QBO_CLIENT_SECRET ? 'configured' : 'not configured',
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: systemInfo,
    });
  } catch (error: any) {
    logger.error('Error fetching system debug info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system debug information',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/debug/database
 * Get database debug information (admin only)
 */
router.get('/debug/database', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    
    // Get table information
    const tables = await db.execute(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema IN ('quickbooks', 'google', 'dashboard', 'jibble', 'import')
      ORDER BY table_schema, table_name
    `);

    res.json({
      success: true,
      data: {
        connected: true,
        tables: tables,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching database debug info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database debug information',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/debug/qbo
 * Get QuickBooks debug information (admin only)
 */
router.get('/debug/qbo', async (req: Request, res: Response) => {
  try {
    const [activeToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.is_active, true))
      .orderBy(desc(tokens.last_updated))
      .limit(1);

    if (!activeToken) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'No active QuickBooks token found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        connected: true,
        realmId: activeToken.realm_id,
        environment: activeToken.environment,
        tokenExpiresAt: activeToken.expires_at,
        refreshTokenExpiresAt: activeToken.refresh_token_expires_at,
        lastUpdated: activeToken.last_updated,
        hasAccessToken: !!activeToken.access_token,
        hasRefreshToken: !!activeToken.refresh_token,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching QuickBooks debug info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QuickBooks debug information',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/logs
 * Get recent log entries (admin only)
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { limit = '100' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // This would require a logs table or file reading
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        logs: [],
        totalLogs: 0,
        message: 'Log retrieval not yet implemented - check log files directly',
      },
    });
  } catch (error: any) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/admin/debug/test-connection
 * Test specific connections (admin only)
 */
router.post('/debug/test-connection', async (req: Request, res: Response) => {
  try {
    const { connectionType } = req.body;

    let result = {};

    switch (connectionType) {
      case 'database':
        await db.execute('SELECT 1');
        result = { connected: true, message: 'Database connection successful' };
        break;
      
      case 'quickbooks':
        const [activeToken] = await db
          .select()
          .from(tokens)
          .where(eq(tokens.is_active, true))
          .orderBy(desc(tokens.last_updated))
          .limit(1);
        
        result = {
          connected: !!activeToken,
          message: activeToken ? 'QuickBooks token found' : 'No active QuickBooks token',
        };
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid connection type. Use "database" or "quickbooks"',
        });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
});

export default router;
