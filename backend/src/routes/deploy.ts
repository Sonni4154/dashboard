import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';

const router = Router();
const execAsync = promisify(exec);

/**
 * POST /api/deploy/webhook
 * Webhook endpoint for triggering deployments
 * Requires webhook secret for security
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { secret, branch = 'master' } = req.body;
    
    // Verify webhook secret
    if (secret !== process.env.DEPLOY_WEBHOOK_SECRET) {
      logger.warn('Deploy webhook called with invalid secret');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook secret'
      });
    }
    
    logger.info('🚀 Deployment webhook triggered', { branch });
    
    // Run deployment script
    const { stdout, stderr } = await execAsync('./deploy.sh', {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutes timeout
    });
    
    if (stderr) {
      logger.error('Deployment stderr:', stderr);
    }
    
    logger.info('Deployment completed:', stdout);
    
    res.json({
      success: true,
      message: 'Deployment triggered successfully',
      output: stdout,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    logger.error('Deployment webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Deployment failed',
      message: error.message
    });
  }
});

/**
 * GET /api/deploy/status
 * Check deployment status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Check if PM2 process is running
    const { stdout } = await execAsync('pm2 list --format json');
    const processes = JSON.parse(stdout);
    
    const appProcess = processes.find((p: any) => p.name === 'marin-pest-control-backend');
    
    if (!appProcess) {
      return res.json({
        success: false,
        status: 'not_running',
        message: 'Application not found in PM2'
      });
    }
    
    res.json({
      success: true,
      status: appProcess.pm2_env.status,
      uptime: appProcess.pm2_env.uptime,
      memory: appProcess.monit.memory,
      cpu: appProcess.monit.cpu,
      restarts: appProcess.pm2_env.restart_time,
      last_restart: appProcess.pm2_env.last_restart_time
    });
    
  } catch (error: any) {
    logger.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check deployment status',
      message: error.message
    });
  }
});

/**
 * POST /api/deploy/restart
 * Restart the application
 */
router.post('/restart', async (req: Request, res: Response) => {
  try {
    const { secret } = req.body;
    
    // Verify secret
    if (secret !== process.env.DEPLOY_WEBHOOK_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Invalid secret'
      });
    }
    
    logger.info('🔄 Application restart requested');
    
    // Restart PM2 process
    await execAsync('pm2 restart marin-pest-control-backend');
    
    res.json({
      success: true,
      message: 'Application restarted successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    logger.error('Restart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart application',
      message: error.message
    });
  }
});

export default router;
