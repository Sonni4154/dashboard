import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required'
      });
    }

    // Authenticate user
    const user = await UserService.authenticateUser(identifier, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = UserService.generateToken(user);

    // Generate session token for additional security
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await UserService.createSession(user.id, sessionToken);

    // Return user info and token
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'user',
      isActive: user.is_active,
      lastLogin: user.last_login
    };

    res.json({
      success: true,
      data: {
        user: userInfo,
        token,
        sessionToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

    logger.info(`User logged in: ${user.username || user.email}`);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      await UserService.deleteSession(sessionToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /api/auth/register
 * Register new user (admin only or if registration is enabled)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if registration is enabled (admin only by default)
    const registrationEnabled = process.env.REGISTRATION_ENABLED === 'true';
    if (!registrationEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Registration is disabled'
      });
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Create user
    const user = await UserService.createUser({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate JWT token
    const token = UserService.generateToken(user);

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await UserService.createSession(user.id, sessionToken);

    // Return user info and token
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'user',
      isActive: user.is_active,
      lastLogin: user.last_login
    };

    res.status(201).json({
      success: true,
      data: {
        user: userInfo,
        token,
        sessionToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

    logger.info(`User registered: ${user.username || user.email}`);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = UserService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Get fresh user data
    const user = await UserService.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user info
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.is_admin ? 'admin' : 'user',
      isActive: user.is_active,
      lastLogin: user.last_login
    };

    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Session token is required'
      });
    }

    // Validate session
    const user = await UserService.validateSession(sessionToken);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Generate new JWT token
    const token = UserService.generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for current user
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { currentPassword, newPassword } = req.body;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token and get user ID
    const decoded = UserService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    const success = await UserService.changePassword(decoded.id, currentPassword, newPassword);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current password'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

    logger.info(`Password changed for user: ${decoded.email}`);
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

export default router;
