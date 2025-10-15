import axios, { AxiosInstance } from 'axios';
import { db, tokens } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

export interface QboConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export class QuickBooksClient {
  private config: QboConfig;
  private baseUrl: string;

  constructor(config: QboConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com/v3/company'
      : 'https://quickbooks.api.intuit.com/v3/company';
  }

  /**
   * Get the current access token from database (no env fallback)
   */
  private async getAccessToken(): Promise<string> {
    // Get token from database only - tokens should only come from OAuth flow
    const [token] = await db.select().from(tokens).where(eq(tokens.is_active, true)).orderBy(tokens.last_updated).limit(1);
    
    if (!token) {
      throw new Error('No QuickBooks access token found. Please connect via OAuth: /api/qbo/connect');
    }

    // Check if token is expired
    if (token.expires_at && new Date() >= token.expires_at) {
      throw new Error('QuickBooks access token has expired. Token manager will auto-refresh.');
    }

    return token.access_token;
  }

  /**
   * Create authenticated axios instance
   */
  private async createAuthenticatedClient(realmId: string): Promise<AxiosInstance> {
    const accessToken = await this.getAccessToken();
    
    return axios.create({
      baseURL: `${this.baseUrl}/${realmId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Execute QuickBooks query
   */
  async query(realmId: string, query: string): Promise<any> {
    try {
      const client = await this.createAuthenticatedClient(realmId);
      const response = await client.post('/query', query, {
        headers: {
          'Content-Type': 'application/text',
        },
      });

      return response.data.QueryResponse;
    } catch (error) {
      logger.error('QuickBooks query failed:', error);
      throw new Error(`QuickBooks query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all customers
   */
  async getCustomers(realmId: string): Promise<any[]> {
    const query = 'SELECT * FROM Customer';
    const response = await this.query(realmId, query);
    return response?.Customer || [];
  }

  /**
   * Get all invoices
   */
  async getInvoices(realmId: string): Promise<any[]> {
    const query = 'SELECT * FROM Invoice';
    const response = await this.query(realmId, query);
    return response?.Invoice || [];
  }

  /**
   * Get all estimates
   */
  async getEstimates(realmId: string): Promise<any[]> {
    const query = 'SELECT * FROM Estimate';
    const response = await this.query(realmId, query);
    return response?.Estimate || [];
  }

  /**
   * Get all items
   */
  async getItems(realmId: string): Promise<any[]> {
    const query = 'SELECT * FROM Item';
    const response = await this.query(realmId, query);
    return response?.Item || [];
  }

  /**
   * Get company info
   */
  async getCompanyInfo(realmId: string): Promise<any> {
    try {
      const client = await this.createAuthenticatedClient(realmId);
      const response = await client.get('/companyinfo/1');
      return response.data.QueryResponse.CompanyInfo[0];
    } catch (error) {
      logger.error('Failed to get company info:', error);
      throw new Error(`Failed to get company info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test token validity
   */
  async testToken(realmId: string): Promise<boolean> {
    try {
      await this.getCompanyInfo(realmId);
      return true;
    } catch (error) {
      logger.error('Token test failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    try {
      const [currentToken] = await db.select().from(tokens).where(eq(tokens.is_active, true)).orderBy(tokens.last_updated).limit(1);
      
      if (!currentToken || !currentToken.refresh_token) {
        throw new Error('No refresh token found');
      }

      const response = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentToken.refresh_token,
        }),
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in, x_refresh_token_expires_in, token_type, scope } = response.data;
      const expiresIn = Number(expires_in ?? 3600);
      const refreshExpiresIn = Number(x_refresh_token_expires_in ?? 60 * 60 * 24 * 100);
      
      const now = new Date();
      const expires_at = new Date(now.getTime() + expiresIn * 1000);
      const refresh_token_expires_at = new Date(now.getTime() + refreshExpiresIn * 1000);

      await db.update(tokens)
        .set({
          access_token: access_token,
          refresh_token: refresh_token || currentToken.refresh_token,
          expires_at: expires_at,
          refresh_token_expires_at: refresh_token_expires_at,
          token_type: token_type,
          scope: scope,
          last_updated: now,
        })
        .where(eq(tokens.id, currentToken.id));

      logger.info('QuickBooks token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh QuickBooks token:', error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create singleton instance
export const qboClient = new QuickBooksClient({
  clientId: process.env.QBO_CLIENT_ID || '',
  clientSecret: process.env.QBO_CLIENT_SECRET || '',
  redirectUri: process.env.QBO_REDIRECT_URI || '',
  environment: (process.env.QBO_ENV as 'sandbox' | 'production') || 'sandbox',
});
