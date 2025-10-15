import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { verifyCustomAuth, requireAdmin, requireManager, requirePermission } from '../middleware/customAuth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyCustomAuth);

/**
 * GET /api/users
 * Get all users (admin/manager only)
 */
router.get('/', requireManager, async (req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsers();
    
    // Remove password hashes from response
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'employee', // Map is_admin to role
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.last_updated
    }));

    res.json({
      success: true,
      data: sanitizedUsers
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID
    
    // Users can only view their own profile unless they're admin/manager
    if (req.user!.id !== userId && !['admin', 'manager'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove password hash from response
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'employee',
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.last_updated
    };

    res.json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate role
    if (role && !['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await UserService.createUser({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Remove password hash from response
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'employee',
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.last_updated
    };

    res.status(201).json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user (admin/manager or self)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID
    const updates = req.body;

    // Users can only update their own profile unless they're admin/manager
    if (req.user!.id !== userId && !['admin', 'manager'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Only admins can change roles
    if (updates.role && req.user!.role !== 'admin') {
      delete updates.role;
    }

    // Remove password-related fields (use separate endpoint for password changes)
    delete updates.password;
    delete updates.passwordHash;

    const user = await UserService.updateUser(userId, updates);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove password hash from response
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'employee',
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.last_updated
    };

    res.json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID

    // Prevent admin from deleting themselves
    if (req.user!.id === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const success = await UserService.deleteUser(userId);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

/**
 * POST /api/users/:id/change-password
 * Change user password
 */
router.post('/:id/change-password', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password unless they're admin
    if (req.user!.id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const success = await UserService.changePassword(String(userId), currentPassword, newPassword);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current password or user not found'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * GET /api/users/:id/permissions
 * Get user permissions
 */
router.get('/:id/permissions', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID

    // Users can only view their own permissions unless they're admin/manager
    if (req.user!.id !== userId && !['admin', 'manager'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const permissions = await UserService.getUserPermissions(userId);
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions'
    });
  }
});

/**
 * POST /api/users/:id/permissions
 * Grant permission to user (admin only)
 */
router.post('/:id/permissions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({
        success: false,
        error: 'Permission is required'
      });
    }

    const success = await UserService.grantPermission(userId, permission, req.user!.id);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to grant permission'
      });
    }

    res.json({
      success: true,
      message: 'Permission granted successfully'
    });
  } catch (error) {
    logger.error('Error granting permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant permission'
    });
  }
});

/**
 * DELETE /api/users/:id/permissions/:permission
 * Revoke permission from user (admin only)
 */
router.delete('/:id/permissions/:permission', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // Keep as string since database uses UUID
    const permission = req.params.permission;

    const success = await UserService.revokePermission(userId, permission as any);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to revoke permission'
      });
    }

    res.json({
      success: true,
      message: 'Permission revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke permission'
    });
  }
});

export default router;
