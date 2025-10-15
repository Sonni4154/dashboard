import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { qboTokenManager } from '../services/qboTokenManager.js';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const execAsync = promisify(exec);

/**
 * GET /api/debug/health
 * System health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        quickbooks: 'unknown',
        filesystem: 'unknown'
      }
    };

    // Test database connection
    try {
      await db.execute('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'error';
      health.status = 'degraded';
    }

    // Test QuickBooks token
    try {
      const tokenStatus = await qboTokenManager.getTokenStatus();
      health.services.quickbooks = tokenStatus.isValid ? 'authenticated' : 'no_token';
    } catch (error) {
      health.services.quickbooks = 'error';
      health.status = 'degraded';
    }

    // Test filesystem
    try {
      await stat(process.cwd());
      health.services.filesystem = 'accessible';
    } catch (error) {
      health.services.filesystem = 'error';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/logs
 * Get recent log entries
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { lines = '100', level = 'all' } = req.query;
    const logFile = join(process.cwd(), 'logs', 'combined.log');
    
    let command = `tail -n ${lines} ${logFile}`;
    if (level !== 'all') {
      command = `grep -i "${level}" ${logFile} | tail -n ${lines}`;
    }

    const { stdout } = await execAsync(command);
    const logs = stdout.split('\n').filter(line => line.trim()).map(line => {
      try {
        // Try to parse JSON log entries
        const parsed = JSON.parse(line);
        return parsed;
      } catch {
        // Return raw line if not JSON
        return { message: line, timestamp: new Date().toISOString() };
      }
    });

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        level: level as string,
        lines: parseInt(lines as string)
      }
    });
  } catch (error: any) {
    logger.error('Failed to fetch logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/database
 * Test database connectivity and get schema info
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    // Test connection
    const connectionTest = await db.execute('SELECT NOW() as current_time, version() as version');
    
    // Get table counts
    const tables = ['customers', 'invoices', 'estimates', 'items', 'tokens'];
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const result = await db.execute(`SELECT COUNT(*) as count FROM quickbooks.${table}`);
        counts[table] = parseInt(String(result[0].count));
      } catch (error) {
        counts[table] = -1; // Table doesn't exist
      }
    }

    // Get database size
    const sizeResult = await db.execute(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    res.json({
      success: true,
      data: {
        connection: {
          status: 'connected',
          current_time: connectionTest[0].current_time,
          version: connectionTest[0].version
        },
        tables: counts,
        database_size: sizeResult[0].size
      }
    });
  } catch (error: any) {
    logger.error('Database check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/quickbooks
 * Check QuickBooks authentication and token status
 */
router.get('/quickbooks', async (req: Request, res: Response) => {
  try {
    const token = await qboTokenManager.getValidToken();
    const tokenInfo = await qboTokenManager.getTokenInfo();
    
    res.json({
      success: true,
      data: {
        authenticated: !!token,
        token_exists: !!tokenInfo,
        token_info: tokenInfo ? {
          id: tokenInfo.id,
          realmId: tokenInfo.realmId,
          createdAt: tokenInfo.createdAt,
          lastUpdated: tokenInfo.lastUpdated,
          expiresAt: tokenInfo.expiresAt,
          isActive: tokenInfo.isActive
        } : null,
        environment: {
          client_id: process.env.QBO_CLIENT_ID ? 'configured' : 'missing',
          client_secret: process.env.QBO_CLIENT_SECRET ? 'configured' : 'missing',
          redirect_uri: process.env.QBO_REDIRECT_URI || 'not_configured',
          webhook_url: process.env.QBO_WEBHOOK_URL || 'not_configured'
        }
      }
    });
  } catch (error: any) {
    logger.error('QuickBooks check failed:', error);
    res.status(500).json({
      success: false,
      message: 'QuickBooks check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/system
 * Get system information
 */
router.get('/system', async (req: Request, res: Response) => {
  try {
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu_usage: process.cpuUsage(),
      environment_variables: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
        QBO_CLIENT_ID: process.env.QBO_CLIENT_ID ? 'configured' : 'missing',
        QBO_CLIENT_SECRET: process.env.QBO_CLIENT_SECRET ? 'configured' : 'missing'
      }
    };

    // Get disk usage
    try {
      const { stdout } = await execAsync('df -h /');
      (systemInfo as any).disk_usage = stdout;
    } catch (error) {
      (systemInfo as any).disk_usage = 'unavailable';
    }

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error: any) {
    logger.error('System info failed:', error);
    res.status(500).json({
      success: false,
      message: 'System info failed',
      error: error.message
    });
  }
});

/**
 * POST /api/debug/test-connection
 * Test a specific connection
 */
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    
    switch (type) {
      case 'database':
        await db.execute('SELECT 1');
        res.json({
          success: true,
          message: 'Database connection successful'
        });
        break;
        
      case 'quickbooks':
        const token = await qboTokenManager.getValidToken();
        if (!token) {
          throw new Error('No valid QuickBooks token found');
        }
        res.json({
          success: true,
          message: 'QuickBooks connection successful',
          data: { token_exists: true }
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid connection type'
        });
    }
  } catch (error: any) {
    logger.error(`Connection test failed for ${req.body.type}:`, error);
    res.status(500).json({
      success: false,
      message: `Connection test failed: ${error.message}`
    });
  }
});

export default router;
