import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';
import { logger } from '../utils/logger.js';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to verify JWT tokens from our custom user system
 */
export const verifyCustomAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authorization header provided' 
      });
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
      return;
    }

    // Verify the JWT token
    const decoded = UserService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token' 
      });
      return;
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Custom auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required' 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has manager or admin role
 */
export const requireManager = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
    return;
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Manager or admin access required' 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
        return;
      }

      // Check user permissions
      const hasPermission = await UserService.hasPermission(req.user.id, permission);
      if (!hasPermission) {
        res.status(403).json({ 
          error: 'Forbidden', 
          message: `Access denied. Required permission: ${permission}` 
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Permission check failed' 
      });
    }
  };
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export const optionalCustomAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      next();
      return;
    }

    // Verify the JWT token
    const decoded = UserService.verifyToken(token);
    if (!decoded) {
      next();
      return;
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.warn('Optional custom auth middleware error:', error);
    next();
  }
};

/**
 * Development middleware for testing (bypasses auth in development)
 */
export const devCustomAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH === 'true') {
    // Mock user for development
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@wemakemarin.com',
      role: 'admin'
    };
    next();
    return;
  }

  // In production, use real auth
  verifyCustomAuth(req, res, next);
};
