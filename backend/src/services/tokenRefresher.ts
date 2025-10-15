import cron from 'node-cron';
import axios from 'axios';
import { db, tokens } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Refresh QuickBooks OAuth tokens
 * This service runs every 50 minutes to refresh tokens before they expire
 */
export async function refreshQuickBooksTokens(): Promise<void> {
  try {
    logger.info('🔄 Starting QuickBooks token refresh...');

    // Get the most recent active token
    const [currentToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.is_active, true))
      .orderBy(tokens.last_updated)
      .limit(1);

    if (!currentToken) {
      logger.warn('⚠️ No active QuickBooks token found for refresh');
      return;
    }

    if (!currentToken.refresh_token) {
      logger.warn('⚠️ No refresh token available');
      return;
    }

    // Check if token is close to expiration (refresh if expires within 10 minutes)
    if (currentToken.expires_at) {
      const expiresAt = new Date(currentToken.expires_at);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const tenMinutes = 10 * 60 * 1000;

      if (timeUntilExpiry > tenMinutes) {
        logger.info(`⏰ Token still valid for ${Math.round(timeUntilExpiry / 60000)} minutes, skipping refresh`);
        return;
      }
    }

    logger.info('🔄 Refreshing QuickBooks access token...');

    // Prepare the refresh request
    const clientId = process.env.QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks client credentials not configured');
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentToken.refresh_token,
      }),
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    const { 
      access_token, 
      refresh_token, 
      expires_in,
      x_refresh_token_expires_in,
      token_type,
      scope 
    } = response.data;
    
    const expiresIn = Number(expires_in ?? 3600);
    const refreshExpiresIn = Number(x_refresh_token_expires_in ?? 60 * 60 * 24 * 100);
    
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + expiresIn * 1000);
    const newRefreshTokenExpiresAt = new Date(now.getTime() + refreshExpiresIn * 1000);

    // Update the token in the database
    await db
      .update(tokens)
      .set({
        access_token: access_token,
        refresh_token: refresh_token || currentToken.refresh_token,
        token_type: token_type || currentToken.token_type || 'Bearer',
        scope: scope || currentToken.scope,
        expires_at: newExpiresAt,
        refresh_token_expires_at: newRefreshTokenExpiresAt,
        last_updated: now,
      })
      .where(eq(tokens.id, currentToken.id));

    logger.info(`✅ QuickBooks token refreshed successfully. Expires at: ${newExpiresAt.toISOString()}`);
  } catch (error) {
    logger.error('❌ Failed to refresh QuickBooks token:', error);
    
    // Log additional details for debugging
    if (axios.isAxiosError(error)) {
      logger.error('Response status:', error.response?.status);
      logger.error('Response data:', error.response?.data);
    }
    
    throw error;
  }
}

/**
 * Schedule token refresh every 50 minutes
 */
export function scheduleTokenRefresh(): void {
  // Run every 50 minutes
  cron.schedule('*/50 * * * *', async () => {
    logger.info('⏰ Running scheduled QuickBooks token refresh...');
    try {
      await refreshQuickBooksTokens();
    } catch (error) {
      logger.error('❌ Scheduled token refresh failed:', error);
    }
  });

  logger.info('📅 Token refresh scheduled to run every 50 minutes');
}

/**
 * Manual token refresh (for testing or immediate needs)
 */
export async function manualTokenRefresh(): Promise<boolean> {
  try {
    await refreshQuickBooksTokens();
    return true;
  } catch (error) {
    logger.error('❌ Manual token refresh failed:', error);
    return false;
  }
}

// If this file is run directly, start the token refresh service
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('🚀 Starting QuickBooks token refresh service...');
  
  // Run initial refresh (don't exit on failure)
  refreshQuickBooksTokens().catch((error) => {
    logger.warn('⚠️ Initial token refresh failed (will retry on schedule):', error);
  });

  // Schedule regular refreshes
  scheduleTokenRefresh();

  // Keep the process alive
  process.on('SIGINT', () => {
    logger.info('🛑 Token refresh service shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('🛑 Token refresh service shutting down...');
    process.exit(0);
  });
  
  logger.info('✅ Token refresh service is running');
}

