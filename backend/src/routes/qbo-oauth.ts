import { Router, Request, Response } from 'express';
import axios from 'axios';
import { db, tokens } from '../db/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

// QuickBooks OAuth configuration
const QBO_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QBO_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

/**
 * GET /api/qbo/connect
 * Redirect to QuickBooks OAuth authorization
 */
router.get('/connect', (req: Request, res: Response) => {
  const clientId = process.env.QBO_CLIENT_ID;
  const redirectUri = process.env.QBO_REDIRECT_URI || `http://${req.get('host')}/api/qbo/callback`;
  const scope = process.env.QBO_SCOPE || 'com.intuit.quickbooks.accounting';
  const state = Math.random().toString(36).substring(7); // Random state for security

  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: 'QuickBooks Client ID not configured',
    });
  }

  const authUrl = `${QBO_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    state: state,
  }).toString();

  logger.info('Redirecting to QuickBooks OAuth:', { redirectUri, state });
  
  // Redirect to QuickBooks
  res.redirect(authUrl);
});

/**
 * GET /api/qbo/callback
 * Handle OAuth callback from QuickBooks
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, realmId, error } = req.query;

    // Check for OAuth errors
    if (error) {
      logger.error('QuickBooks OAuth error:', error);
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ QuickBooks Authorization Failed</h1>
            <p>Error: ${error}</p>
            <a href="/">Go back to dashboard</a>
          </body>
        </html>
      `);
    }

    if (!code || !realmId) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Missing authorization code or realm ID</h1>
            <a href="/">Go back to dashboard</a>
          </body>
        </html>
      `);
    }

    // Exchange authorization code for tokens
    const clientId = process.env.QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;
    const redirectUri = process.env.QBO_REDIRECT_URI || `http://${req.get('host')}/api/qbo/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks credentials not configured');
    }

    const tokenResponse = await axios.post(
      QBO_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    const { 
      access_token, 
      refresh_token, 
      expires_in,
      x_refresh_token_expires_in,
      token_type,
      scope 
    } = tokenResponse.data;

    // Calculate access token expiration (typically 1 hour)
    const expiresIn = Number(expires_in ?? 3600);
    const refreshExpiresIn = Number(x_refresh_token_expires_in ?? 60 * 60 * 24 * 100); // fallback ~100 days
    
    const now = new Date();
    const expires_at = new Date(now.getTime() + expiresIn * 1000);
    const refresh_token_expires_at = new Date(now.getTime() + refreshExpiresIn * 1000);

    // Determine the environment
    const qboEnv = (process.env.QBO_ENV || 'production') as 'sandbox' | 'production';
    const environment = qboEnv === 'sandbox' ? 'sandbox' : 'production';

    // Generate ID based on timestamp (bigint)
    const tokenId = BigInt(Date.now());
    
    // Save tokens to database with updated schema
    await db.insert(tokens).values({
      id: tokenId,
      realm_id: realmId as string,
      access_token: access_token,
      refresh_token: refresh_token,
      token_type: token_type || 'Bearer',
      scope: scope || process.env.QBO_SCOPE || 'com.intuit.quickbooks.accounting',
      expires_at: expires_at,
      refresh_token_expires_at: refresh_token_expires_at,
      is_active: true,
      created_at: now,
      last_updated: now,
    } as any);

    logger.info('QuickBooks tokens saved successfully', { realmId });

    // Success page
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #28a745; }
            .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>✅ QuickBooks Connected Successfully!</h1>
          <div class="info">
            <p><strong>Company ID:</strong> ${realmId}</p>
            <p><strong>Status:</strong> Connected and authorized</p>
            <p><strong>Token expires:</strong> ${expires_at.toLocaleString()}</p>
            <p><strong>Refresh token expires:</strong> ${refresh_token_expires_at.toLocaleString()}</p>
          </div>
          <p>Your dashboard can now sync data from QuickBooks!</p>
          <a href="/" class="btn">Go to Dashboard</a>
        </body>
      </html>
    `);
  } catch (error: any) {
    logger.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Failed to complete authorization</h1>
          <p>Error: ${error.message}</p>
          <a href="/api/qbo/connect">Try again</a>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/qbo/disconnect
 * Remove QuickBooks authorization
 */
router.get('/disconnect', async (req: Request, res: Response) => {
  try {
    await db.delete(tokens);
    logger.info('QuickBooks tokens removed');
    
    res.json({
      success: true,
      message: 'QuickBooks disconnected successfully',
    });
  } catch (error: any) {
    logger.error('Error disconnecting QuickBooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect QuickBooks',
      message: error.message,
    });
  }
});

export default router;

