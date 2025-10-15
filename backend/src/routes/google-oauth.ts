import { Router, Request, Response } from 'express';
import axios from 'axios';
import { db, users } from '../db/index.js';
import { eq, and, or } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

// Google OAuth configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * GET /api/auth/google
 * Redirect to Google OAuth authorization
 */
router.get('/google', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://${req.get('host')}/api/auth/google/callback`;
  const scope = 'openid email profile';
  const state = crypto.randomBytes(32).toString('hex');

  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: 'Google Client ID not configured',
    });
  }

  const authUrl = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

  logger.info('Redirecting to Google OAuth:', { redirectUri, state });
  
  // Store state in session or cookie for verification
  res.cookie('oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
  res.redirect(authUrl);
});

/**
 * GET /api/auth/google/callback
 * Handle OAuth callback from Google
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    const storedState = req.cookies.oauth_state;

    // Verify state parameter
    if (!state || state !== storedState) {
      logger.error('Invalid OAuth state parameter');
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Invalid OAuth State</h1>
            <p>Security verification failed</p>
            <a href="/">Go back to dashboard</a>
          </body>
        </html>
      `);
    }

    // Clear the state cookie
    res.clearCookie('oauth_state');

    // Check for OAuth errors
    if (error) {
      logger.error('Google OAuth error:', error);
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Google Authorization Failed</h1>
            <p>Error: ${error}</p>
            <a href="/">Go back to dashboard</a>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Missing authorization code</h1>
            <a href="/">Go back to dashboard</a>
          </body>
        </html>
      `);
    }

    // Exchange authorization code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://${req.get('host')}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const tokenResponse = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info from Google
    const userInfoResponse = await axios.get(GOOGLE_USER_INFO_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const { id: googleId, email, name, picture } = userInfoResponse.data;

    // Check if user exists in database
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.email, email),
        eq(users.google_id, googleId)
      )
    });

    if (!user) {
      // Create new user
      const [newUser] = await db.insert(users).values({
        google_id: googleId,
        email: email,
        username: email.split('@')[0], // Use email prefix as username
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || '',
        profile_picture: picture,
        role: 'user', // Default role
        is_active: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }).returning();

      user = newUser;
      logger.info(`New user created via Google OAuth: ${email}`);
    } else {
      // Update existing user
      await db.update(users)
        .set({
          google_id: googleId,
          profile_picture: picture,
          last_login: new Date(),
          updated_at: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Return success page with token
    res.send(`
      <html>
        <body>
          <h1>✅ Google Login Successful</h1>
          <p>Welcome, ${user.first_name}!</p>
          <script>
            // Store token in localStorage and redirect
            localStorage.setItem('auth_token', '${token}');
            localStorage.setItem('session_token', '${sessionToken}');
            localStorage.setItem('user_info', '${JSON.stringify({
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role,
              profilePicture: user.profile_picture
            })}');
            window.location.href = '/dashboard';
          </script>
        </body>
      </html>
    `);

    logger.info(`User logged in via Google OAuth: ${user.email}`);
  } catch (error: any) {
    logger.error('Google OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Authentication Error</h1>
          <p>An error occurred during authentication: ${error.message}</p>
          <a href="/">Go back to dashboard</a>
        </body>
      </html>
    `);
  }
});

export default router;
