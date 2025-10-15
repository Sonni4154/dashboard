import cron from 'node-cron';
import axios from 'axios';
import { db, tokens, setServiceRoleContext } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { RLSService } from './rlsService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Comprehensive QuickBooks OAuth Token Manager
 * Handles all token lifecycle: initialization, refresh, expiration, and reauthorization
 */
export class QuickBooksTokenManager {
  private static instance: QuickBooksTokenManager;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): QuickBooksTokenManager {
    if (!QuickBooksTokenManager.instance) {
      QuickBooksTokenManager.instance = new QuickBooksTokenManager();
    }
    return QuickBooksTokenManager.instance;
  }

  /**
   * Start the token management service
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ QuickBooks token manager is already running');
      return;
    }

    logger.info('🚀 Starting QuickBooks Token Manager...');
    
    try {
      // 1. Check if we have valid tokens on startup
      await this.checkAndRefreshTokens();
      
      // 2. Schedule regular token checks every 30 minutes
      this.scheduleTokenChecks();
      
      // 3. Schedule daily token validation
      this.scheduleDailyValidation();
      
      this.isRunning = true;
      logger.info('✅ QuickBooks Token Manager started successfully');
      
    } catch (error) {
      logger.error('❌ Failed to start QuickBooks Token Manager:', error);
      throw error;
    }
  }

  /**
   * Stop the token management service
   */
  public stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isRunning = false;
    logger.info('🛑 QuickBooks Token Manager stopped');
  }

  /**
   * Check and refresh tokens if needed
   */
  public async checkAndRefreshTokens(): Promise<boolean> {
    try {
      logger.info('🔍 Checking QuickBooks token status...');

      // Use service role context for token management
      return await RLSService.withServiceRole(async () => {
        const [currentToken] = await db
          .select()
          .from(tokens)
          .where(eq(tokens.is_active, true))
          .orderBy(desc(tokens.last_updated))
          .limit(1);

        if (!currentToken) {
          logger.warn('⚠️ No active QuickBooks token found');
          return false;
        }

        if (!currentToken.refresh_token) {
          logger.error('❌ No refresh token available - reauthorization required');
          return false;
        }

        // Check if access token is expired or expires soon
        const now = new Date();
        const expiresAt = currentToken.expires_at ? new Date(currentToken.expires_at) : null;

        // Check if refresh token is expired (95 days)
        const refreshExpiresAt = currentToken.refresh_token_expires_at 
          ? new Date(currentToken.refresh_token_expires_at) 
          : null;
        
        if (refreshExpiresAt && now >= refreshExpiresAt) {
          logger.error('❌ Refresh token expired - reauthorization required');
          await this.markTokenInactive(currentToken.id);
          return false;
        }

        // Check if access token needs refresh (expires within 10 minutes)
        if (expiresAt) {
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          const tenMinutes = 10 * 60 * 1000;

          if (timeUntilExpiry <= tenMinutes) {
            logger.info('🔄 Access token expires soon, refreshing...');
            return await this.refreshAccessToken(currentToken);
          } else {
            logger.info(`✅ Access token valid for ${Math.round(timeUntilExpiry / 60000)} minutes`);
            return true;
          }
        }

        return true;
      });

    } catch (error) {
      logger.error('❌ Error checking token status:', error);
      return false;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(token: any): Promise<boolean> {
    try {
      logger.info('🔄 Refreshing QuickBooks access token...');

      // Use service role context for token refresh
      return await RLSService.withServiceRole(async () => {
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
            refresh_token: token.refresh_token,
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
          refresh_token: refresh_token || token.refresh_token,
          expires_at: newExpiresAt,
          refresh_token_expires_at: newRefreshTokenExpiresAt,
          token_type: token_type,
          scope: scope,
          last_updated: now,
        })
        .where(eq(tokens.id, token.id));

        logger.info(`✅ QuickBooks token refreshed successfully. Expires at: ${newExpiresAt.toISOString()}`);
        return true;
      });

    } catch (error) {
      logger.error('❌ Failed to refresh QuickBooks token:', error);
      
      if (axios.isAxiosError(error)) {
        logger.error('Response status:', error.response?.status);
        logger.error('Response data:', error.response?.data);
        
        // If refresh token is invalid, mark token as inactive
        if (error.response?.status === 400 || error.response?.status === 401) {
          logger.error('❌ Refresh token is invalid - reauthorization required');
          await this.markTokenInactive(token.id);
        }
      }
      
      return false;
    }
  }

  /**
   * Mark a token as inactive
   */
  private async markTokenInactive(tokenId: bigint): Promise<void> {
    try {
      await RLSService.withServiceRole(async () => {
        await db
          .update(tokens)
          .set({
            is_active: false,
            last_updated: new Date()
          })
          .where(eq(tokens.id, tokenId));
        
        logger.warn(`⚠️ Token ${tokenId} marked as inactive`);
      });
    } catch (error) {
      logger.error('❌ Failed to mark token inactive:', error);
    }
  }

  /**
   * Schedule regular token checks every 30 minutes
   */
  private scheduleTokenChecks(): void {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      logger.info('⏰ Running scheduled QuickBooks token check...');
      try {
        await this.checkAndRefreshTokens();
      } catch (error) {
        logger.error('❌ Scheduled token check failed:', error);
      }
    });

    logger.info('📅 Token checks scheduled to run every 30 minutes');
  }

  /**
   * Schedule daily token validation
   */
  private scheduleDailyValidation(): void {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('🌅 Running daily QuickBooks token validation...');
      try {
        const isValid = await this.checkAndRefreshTokens();
        if (!isValid) {
          logger.warn('⚠️ Daily validation failed - manual intervention may be required');
        }
      } catch (error) {
        logger.error('❌ Daily token validation failed:', error);
      }
    });

    logger.info('📅 Daily token validation scheduled for 2:00 AM');
  }

  /**
   * Get current token status
   */
  public async getTokenStatus(): Promise<any> {
    try {
      const [token] = await db
        .select()
        .from(tokens)
        .where(eq(tokens.is_active, true))
        .orderBy(desc(tokens.last_updated))
        .limit(1);

      if (!token) {
        return {
          hasToken: false,
          status: 'No active token',
          needsReauthorization: true
        };
      }

      const now = new Date();
      const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
      const refreshExpiresAt = token.refresh_token_expires_at 
        ? new Date(token.refresh_token_expires_at) 
        : null;

      let status = 'Valid';
      let needsReauthorization = false;

      if (refreshExpiresAt && now >= refreshExpiresAt) {
        status = 'Refresh token expired - reauthorization required';
        needsReauthorization = true;
      } else if (expiresAt && now >= expiresAt) {
        status = 'Access token expired (will auto-refresh)';
      } else if (expiresAt) {
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const minutesUntilExpiry = Math.round(timeUntilExpiry / 60000);
        status = `Valid for ${minutesUntilExpiry} minutes`;
      }

      return {
        hasToken: true,
        status,
        needsReauthorization,
        isActive: token.is_active,
        realmId: token.realm_id,
        expiresAt: expiresAt?.toISOString(),
        refreshTokenExpiresAt: refreshExpiresAt?.toISOString(),
        environment: token.environment,
        lastUpdated: token.last_updated?.toISOString()
      };

    } catch (error) {
      logger.error('❌ Error getting token status:', error);
      return {
        hasToken: false,
        status: 'Error checking status',
        needsReauthorization: true
      };
    }
  }

  /**
   * Force a token refresh (for manual testing)
   */
  public async forceRefresh(): Promise<boolean> {
    logger.info('🔄 Force refreshing QuickBooks token...');
    return await this.checkAndRefreshTokens();
  }
}

// Export singleton instance
export const qboTokenManager = QuickBooksTokenManager.getInstance();
