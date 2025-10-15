import { db, tokens } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

/**
 * Initialize QuickBooks tokens from environment variables
 * This is useful for initial setup when you have tokens from QuickBooks OAuth flow
 */
export async function initializeTokensFromEnv(): Promise<void> {
  try {
    const access_token = process.env.QBO_INITIAL_ACCESS_TOKEN;
    const refresh_token = process.env.QBO_REFRESH_ACCESS_TOKEN;
    const realm_id = process.env.QBO_REALM_ID;

    if (!access_token || !refresh_token || !realm_id) {
      logger.warn('QuickBooks tokens not found in environment variables');
      return;
    }

    // Check if token already exists for this realm
    const [existingToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.realm_id, realm_id));

    if (existingToken) {
      logger.info(`Token already exists for realm ${realm_id}, skipping initialization`);
      return;
    }

    // Determine the environment based on environment variable
    const qboEnv = (process.env.QBO_ENV || 'production') as 'sandbox' | 'production';
    const environment = qboEnv === 'sandbox' ? 'sandbox' : 'production';

    // Calculate expiration times
    const now = new Date();
    const expires_at = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const refresh_token_expires_at = new Date(now.getTime() + 60 * 60 * 24 * 100 * 1000); // ~100 days

    // Insert the token with correct schema
    await db.insert(tokens).values({
      id: BigInt(Date.now()), // Use timestamp as BigInt ID
      realm_id: realm_id,
      access_token: access_token,
      refresh_token: refresh_token,
      token_type: 'Bearer',
      scope: process.env.QBO_SCOPE || 'com.intuit.quickbooks.accounting',
      expires_at: expires_at,
      refresh_token_expires_at: refresh_token_expires_at,
      is_active: true,
      created_at: now,
      last_updated: now,
    } as any);

    logger.info(`✅ QuickBooks token initialized for realm ${realm_id}`);
  } catch (error) {
    logger.error('❌ Failed to initialize QuickBooks tokens:', error);
    throw error;
  }
}

/**
 * Check if we have valid QuickBooks tokens
 */
export async function hasValidTokens(): Promise<boolean> {
  try {
    const [token] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.is_active, true))
      .orderBy(tokens.last_updated)
      .limit(1);

    if (!token || !token.expires_at) {
      return false;
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    
    return now < expiresAt;
  } catch (error) {
    logger.error('Error checking token validity:', error);
    return false;
  }
}
