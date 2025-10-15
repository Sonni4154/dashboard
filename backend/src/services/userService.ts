import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq, and, or, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, authSessions, userPermissions, type User, type NewUser } from '../db/user-schema.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SESSION_EXPIRES_IN = process.env.SESSION_EXPIRES_IN || '7d';

export class UserService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a new user
   */
  static async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<User> {
    try {
      const passwordHash = await this.hashPassword(userData.password);
      
      const newUser: NewUser = {
        // username: userData.username, // Remove if not in schema
        email: userData.email,
        password_hash: passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName
      };

      const [user] = await db.insert(users).values(newUser).returning();
      logger.info(`User created: ${user.username} (${user.email})`);
      
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Authenticate user with username/email and password
   */
  static async authenticateUser(identifier: string, password: string): Promise<User | null> {
    try {
      // Find user by username or email
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.is_active, true),
          or(
            eq(users.username, identifier),
            eq(users.email, identifier)
          )
        )
      });

      if (!user) {
        logger.warn(`Authentication failed: User not found - ${identifier}`);
        return null;
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        logger.warn(`Authentication failed: Invalid password - ${identifier}`);
        return null;
      }

      // Update last login
      await db.update(users)
        .set({ last_login: new Date() })
        .where(eq(users.id, user.id));

      logger.info(`User authenticated: ${user.username}`);
      return user;
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Generate JWT token for user
   */
  static generateToken(user: User): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.is_admin ? 'admin' : 'employee',
      firstName: user.first_name,
      lastName: user.last_name
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.warn('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Create user session
   */
  static async createSession(userId: number, sessionToken: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(SESSION_EXPIRES_IN.replace('d', '')));

      await db.insert(userSessions).values({
        userId,
        sessionToken,
        expiresAt
      });

      logger.info(`Session created for user ${userId}`);
    } catch (error) {
      logger.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Validate session token
   */
  static async validateSession(sessionToken: string): Promise<User | null> {
    try {
      const session = await db.query.authSessions.findFirst({
        where: and(
          eq(authSessions.session_token, sessionToken),
          gt(authSessions.expires_at, new Date())
        ),
        with: {
          user: true
        }
      });

      if (!session || !session.user || !session.user.isActive) {
        return null;
      }

      // Update last accessed time
      await db.update(userSessions)
        .set({ lastAccessed: new Date() })
        .where(eq(userSessions.id, session.id));

      return session.user;
    } catch (error) {
      logger.error('Error validating session:', error);
      return null;
    }
  }

  /**
   * Delete session (logout)
   */
  static async deleteSession(sessionToken: string): Promise<void> {
    try {
      await db.delete(userSessions)
        .where(eq(userSessions.sessionToken, sessionToken));
      
      logger.info(`Session deleted: ${sessionToken}`);
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      return user || null;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      return await db.query.users.findMany({
        orderBy: [users.createdAt]
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Update user
   */
  static async updateUser(id: string, updates: Partial<NewUser>): Promise<User | null> {
    try {
      const [user] = await db.update(users)
        .set({ ...updates, last_updated: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (user) {
        logger.info(`User updated: ${user.username}`);
      }
      
      return user || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      return null;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      logger.info(`User deleted: ID ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUserById(id);
      if (!user) {
        return false;
      }

      // Verify current password
      const isValidCurrentPassword = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isValidCurrentPassword) {
        logger.warn(`Password change failed: Invalid current password for user ${user.username}`);
        return false;
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await db.update(users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, id));

      logger.info(`Password changed for user: ${user.username}`);
      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(userId: number, permission: Permission): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return false;
      }

      // Admin users have all permissions
      if (user.role === 'admin') {
        return true;
      }

      // Check specific permission
      const userPermission = await db.query.userPermissions.findFirst({
        where: and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        )
      });

      return !!userPermission;
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Grant permission to user
   */
  static async grantPermission(userId: number, permission: Permission, grantedBy: number): Promise<boolean> {
    try {
      await db.insert(userPermissions).values({
        userId,
        permission,
        grantedBy
      });

      logger.info(`Permission granted: ${permission} to user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error granting permission:', error);
      return false;
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(userId: number, permission: Permission): Promise<boolean> {
    try {
      await db.delete(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        ));

      logger.info(`Permission revoked: ${permission} from user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error revoking permission:', error);
      return false;
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return [];
      }

      // Admin users have all permissions
      if (user.role === 'admin') {
        return [
          'manage_users',
          'manage_settings',
          'view_all_data',
          'manage_invoices',
          'manage_customers',
          'manage_items',
          'view_reports',
          'manage_time_tracking',
          'manage_calendar'
        ];
      }

      const permissions = await db.query.userPermissions.findMany({
        where: eq(userPermissions.userId, userId),
        columns: {
          permission: true
        }
      });

      return permissions.map(p => p.permission as Permission);
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      return [];
    }
  }
}

