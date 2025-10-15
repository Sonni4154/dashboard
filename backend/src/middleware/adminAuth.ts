import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Admin Authentication Middleware
 * 
 * Ensures that only admin users can access admin-only endpoints.
 * Checks for admin claim in JWT token and admin key header.
 */

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for admin key header (for API access)
    const adminKey = req.headers['x-admin-key'] as string;
    const expectedAdminKey = process.env.ADMIN_API_KEY;

    if (adminKey && expectedAdminKey && adminKey === expectedAdminKey) {
      // Admin key is valid
      (req as any).isAdmin = true;
      return next();
    }

    // Check for admin claim in JWT token
    const user = (req as any).user;
    if (user && user.role === 'admin') {
      (req as any).isAdmin = true;
      return next();
    }

    // Check for admin claim in custom auth
    const customUser = (req as any).customUser;
    if (customUser && customUser.role === 'admin') {
      (req as any).isAdmin = true;
      return next();
    }

    // No admin access
    logger.warn('Admin access denied:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      timestamp: new Date().toISOString(),
    });

    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required',
    });
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication check failed',
    });
  }
}

/**
 * Development admin auth (bypasses real admin checks in dev)
 */
export function devAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development') {
    // In development, allow admin access
    (req as any).isAdmin = true;
    return next();
  }

  // In production, use real admin auth
  return adminAuth(req, res, next);
}

export default adminAuth;
