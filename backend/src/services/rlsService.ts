import { db, setServiceRoleContext, setUserContext, setAdminContext, clearRLSContext, getCurrentContext } from '../db/index.js';
import { logger } from '../utils/logger.js';

/**
 * 🔒 RLS Service - Manages Row Level Security Context
 * 
 * This service provides methods to manage RLS context for different operations:
 * - Service Role: For backend system operations (bypasses RLS)
 * - User Context: For authenticated user operations (enforces RLS)
 * - Admin Context: For administrative operations (admin-level RLS)
 */

export class RLSService {
  /**
   * Execute operation with service role context
   * This bypasses RLS for system operations
   */
  static async withServiceRole<T>(operation: () => Promise<T>): Promise<T> {
    const originalContext = await getCurrentContext();
    
    try {
      await setServiceRoleContext();
      logger.debug('🔑 Executing operation with service role context');
      return await operation();
    } catch (error) {
      logger.error('❌ Operation failed with service role context:', error);
      throw error;
    } finally {
      // Restore original context if it existed
      if (originalContext) {
        if (originalContext.role === 'authenticated') {
          await setUserContext(originalContext.sub);
        } else if (originalContext.role === 'admin_role') {
          await setAdminContext(originalContext.sub);
        }
      } else {
        await clearRLSContext();
      }
    }
  }

  /**
   * Execute operation with user context
   * This enforces RLS based on the authenticated user
   */
  static async withUserContext<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    const originalContext = await getCurrentContext();
    
    try {
      await setUserContext(userId);
      logger.debug(`🔑 Executing operation with user context: ${userId}`);
      return await operation();
    } catch (error) {
      logger.error(`❌ Operation failed with user context for user ${userId}:`, error);
      throw error;
    } finally {
      // Restore original context if it existed
      if (originalContext) {
        if (originalContext.role === 'service_role') {
          await setServiceRoleContext();
        } else if (originalContext.role === 'admin_role') {
          await setAdminContext(originalContext.sub);
        }
      } else {
        await clearRLSContext();
      }
    }
  }

  /**
   * Execute operation with admin context
   * This enables admin-level access through RLS
   */
  static async withAdminContext<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    const originalContext = await getCurrentContext();
    
    try {
      await setAdminContext(userId);
      logger.debug(`🔑 Executing operation with admin context: ${userId}`);
      return await operation();
    } catch (error) {
      logger.error(`❌ Operation failed with admin context for user ${userId}:`, error);
      throw error;
    } finally {
      // Restore original context if it existed
      if (originalContext) {
        if (originalContext.role === 'service_role') {
          await setServiceRoleContext();
        } else if (originalContext.role === 'authenticated') {
          await setUserContext(originalContext.sub);
        }
      } else {
        await clearRLSContext();
      }
    }
  }

  /**
   * Execute operation without RLS context
   * This clears any existing context
   */
  static async withoutContext<T>(operation: () => Promise<T>): Promise<T> {
    const originalContext = await getCurrentContext();
    
    try {
      await clearRLSContext();
      logger.debug('🔑 Executing operation without RLS context');
      return await operation();
    } catch (error) {
      logger.error('❌ Operation failed without RLS context:', error);
      throw error;
    } finally {
      // Restore original context if it existed
      if (originalContext) {
        if (originalContext.role === 'service_role') {
          await setServiceRoleContext();
        } else if (originalContext.role === 'authenticated') {
          await setUserContext(originalContext.sub);
        } else if (originalContext.role === 'admin_role') {
          await setAdminContext(originalContext.sub);
        }
      }
    }
  }

  /**
   * Get current RLS context information
   */
  static async getContextInfo(): Promise<{
    context: any;
    isServiceRole: boolean;
    isUserContext: boolean;
    isAdminContext: boolean;
    userId?: string;
  }> {
    try {
      const context = await getCurrentContext();
      
      return {
        context,
        isServiceRole: context?.role === 'service_role',
        isUserContext: context?.role === 'authenticated',
        isAdminContext: context?.role === 'admin_role',
        userId: context?.sub
      };
    } catch (error) {
      logger.error('❌ Failed to get context info:', error);
      return {
        context: null,
        isServiceRole: false,
        isUserContext: false,
        isAdminContext: false
      };
    }
  }

  /**
   * Verify that the current context has the required role
   */
  static async verifyRole(requiredRole: 'service_role' | 'authenticated' | 'admin_role'): Promise<boolean> {
    try {
      const context = await getCurrentContext();
      return context?.role === requiredRole;
    } catch (error) {
      logger.error('❌ Failed to verify role:', error);
      return false;
    }
  }

  /**
   * Verify that the current context is for a specific user
   */
  static async verifyUser(userId: string): Promise<boolean> {
    try {
      const context = await getCurrentContext();
      return context?.sub === userId;
    } catch (error) {
      logger.error('❌ Failed to verify user:', error);
      return false;
    }
  }
}

/**
 * 🔧 RLS Middleware for Express routes
 * 
 * This middleware can be used to automatically set RLS context
 * based on the authenticated user in the request
 */
export function createRLSMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      // Check if user is authenticated
      if (req.user && req.user.id) {
        // Set user context for authenticated requests
        await setUserContext(req.user.id);
        logger.debug(`🔑 RLS middleware set user context: ${req.user.id}`);
      } else {
        // Clear context for unauthenticated requests
        await clearRLSContext();
        logger.debug('🔑 RLS middleware cleared context for unauthenticated request');
      }
      
      next();
    } catch (error) {
      logger.error('❌ RLS middleware error:', error);
      next(error);
    }
  };
}

/**
 * 🔧 RLS Middleware for admin routes
 * 
 * This middleware sets admin context for administrative operations
 */
export function createAdminRLSMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      // Check if user is authenticated and is admin
      if (req.user && req.user.id && req.user.is_admin) {
        await setAdminContext(req.user.id);
        logger.debug(`🔑 Admin RLS middleware set admin context: ${req.user.id}`);
      } else {
        // Fall back to service role for system operations
        await setServiceRoleContext();
        logger.debug('🔑 Admin RLS middleware set service role context');
      }
      
      next();
    } catch (error) {
      logger.error('❌ Admin RLS middleware error:', error);
      next(error);
    }
  };
}
