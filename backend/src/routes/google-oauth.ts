import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const router = Router();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow through Supabase
 */
router.get('/google', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase not configured'
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/api/auth/google/callback`
      }
    });

    if (error) {
      logger.error('Google OAuth initiation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to initiate Google OAuth'
      });
    }

    // Redirect to Google OAuth
    res.redirect(data.url);
  } catch (error: any) {
    logger.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google OAuth failed'
    });
  }
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback from Supabase
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).send(`
      <html>
        <body>
          <h1>❌ Supabase Configuration Error</h1>
          <p>Supabase is not properly configured</p>
        </body>
      </html>
    `);
  }

  try {
    const { code, error } = req.query;

    if (error) {
      logger.error('Google OAuth callback error:', error);
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

    // Exchange code for session
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code as string);

    if (sessionError || !data.session) {
      logger.error('Failed to exchange code for session:', sessionError);
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Failed to complete authorization</h1>
            <p>Error: ${sessionError?.message || 'Unknown error'}</p>
            <a href="/api/auth/google">Try again</a>
          </body>
        </html>
      `);
    }

    const { user, session } = data;

    logger.info('Google OAuth successful:', { 
      userId: user.id, 
      email: user.email,
      provider: user.app_metadata?.provider 
    });

    // Check if user exists in our database and get their role
    let userRole = 'authenticated'; // Default role
    let isAdmin = false;
    
    try {
      // Import the database and user schema
      const { db, users } = await import('../db/index.js');
      const { eq } = await import('drizzle-orm');
      
      // Check if user exists in our users table
      const existingUser = await db.query.users.findFirst({
        where: eq(users.google_id, user.id)
      });
      
      if (existingUser) {
        isAdmin = existingUser.is_admin;
        userRole = isAdmin ? 'admin_role' : 'employee_role';
        logger.info(`User role determined: ${userRole} (is_admin: ${isAdmin})`);
      } else {
        logger.warn(`User ${user.email} not found in local database, using default role: ${userRole}`);
      }
    } catch (error) {
      logger.error('Error checking user role:', error);
      // Continue with default role
    }

    // Success page with user info
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #28a745; }
            .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .token { background: #e9ecef; padding: 10px; border-radius: 3px; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>✅ Google Authentication Successful!</h1>
          <div class="info">
            <p><strong>User ID:</strong> ${user.id}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Name:</strong> ${user.user_metadata?.full_name || 'N/A'}</p>
            <p><strong>Provider:</strong> ${user.app_metadata?.provider || 'google'}</p>
            <p><strong>Email Verified:</strong> ${user.email_confirmed_at ? 'Yes' : 'No'}</p>
            <p><strong>Role:</strong> ${userRole} ${isAdmin ? '(Admin)' : '(Employee)'}</p>
          </div>
          <div class="info">
            <p><strong>Access Token:</strong></p>
            <div class="token">${session.access_token}</div>
          </div>
          <p>You can now use this token to authenticate with the API!</p>
          <a href="/" class="btn">Go to Dashboard</a>
        </body>
      </html>
    `);
  } catch (error: any) {
    logger.error('Google OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Failed to complete authorization</h1>
          <p>Error: ${error.message}</p>
          <a href="/api/auth/google">Try again</a>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase not configured'
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name,
          avatar: user.user_metadata?.avatar_url,
          provider: user.app_metadata?.provider,
          emailVerified: !!user.email_confirmed_at,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        }
      }
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase not configured'
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }

    const token = authHeader.substring(7);
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    if (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }

    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/refresh
 * Refresh access token
 */
router.get('/refresh', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase not configured'
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });

    if (error || !data.session) {
      return res.status(401).json({
        success: false,
        error: 'Failed to refresh session'
      });
    }

    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      }
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

export default router;