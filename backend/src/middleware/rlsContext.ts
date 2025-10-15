import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase configuration missing');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Middleware to set RLS context based on user authentication
 * This ensures the correct role is set for database operations
 */
export async function setRLSContext(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No authentication, use service role for public endpoints
      await setServiceRoleContext();
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the JWT token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        logger.warn('Invalid JWT token, using service role context');
        await setServiceRoleContext();
        return next();
      }

      // Check if user exists in our database and get their role
      const existingUser = await db.query.users.findFirst({
        where: eq(users.google_id, user.id)
      });

      if (!existingUser) {
        logger.warn(`User ${user.email} not found in local database, using service role context`);
        await setServiceRoleContext();
        return next();
      }

      // Set the appropriate RLS context based on user role
      if (existingUser.is_admin) {
        await setAdminContext(user.id);
        logger.debug(`Set admin context for user: ${user.email}`);
      } else {
        await setUserContext(user.id);
        logger.debug(`Set user context for user: ${user.email}`);
      }

      // Add user info to request for use in routes
      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: existingUser.is_admin,
        role: existingUser.is_admin ? 'admin_role' : 'employee_role'
      };

    } catch (tokenError) {
      logger.error('Error verifying JWT token:', tokenError);
      await setServiceRoleContext();
    }

    next();
  } catch (error) {
    logger.error('Error setting RLS context:', error);
    await setServiceRoleContext();
    next();
  }
}

/**
 * Set service role context (bypasses RLS)
 */
async function setServiceRoleContext(): Promise<void> {
  try {
    await supabaseAdmin.rpc('set_service_role_context');
  } catch (error) {
    logger.error('Failed to set service role context:', error);
  }
}

/**
 * Set user context (enables RLS for authenticated user)
 */
async function setUserContext(userId: string): Promise<void> {
  try {
    await supabaseAdmin.rpc('set_user_context', { user_id: userId });
  } catch (error) {
    logger.error('Failed to set user context:', error);
  }
}

/**
 * Set admin context (enables admin-level RLS)
 */
async function setAdminContext(userId: string): Promise<void> {
  try {
    await supabaseAdmin.rpc('set_admin_context', { user_id: userId });
  } catch (error) {
    logger.error('Failed to set admin context:', error);
  }
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin?: boolean;
        role: string;
        [key: string]: any;
      };
    }
  }
}
