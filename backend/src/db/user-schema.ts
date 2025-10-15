import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for authentication and authorization
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  usernameIdx: index('idx_users_username').on(table.username),
  roleIdx: index('idx_users_role').on(table.role),
  activeIdx: index('idx_users_active').on(table.isActive)
}));

// User sessions for token-based authentication
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessed: timestamp('last_accessed').defaultNow().notNull()
}, (table) => ({
  tokenIdx: index('idx_user_sessions_token').on(table.sessionToken),
  userIdx: index('idx_user_sessions_user_id').on(table.userId),
  expiresIdx: index('idx_user_sessions_expires').on(table.expiresAt)
}));

// User permissions for granular access control
export const userPermissions = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 100 }).notNull(),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  grantedBy: integer('granted_by').references(() => users.id)
}, (table) => ({
  userIdx: index('idx_user_permissions_user_id').on(table.userId),
  permissionIdx: index('idx_user_permissions_permission').on(table.permission),
  uniqueUserPermission: index('idx_user_permissions_unique').on(table.userId, table.permission)
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  permissions: many(userPermissions)
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  })
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id]
  }),
  grantedByUser: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id]
  })
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;

// Role types
export type UserRole = 'admin' | 'manager' | 'user';

// Permission types
export type Permission = 
  | 'manage_users'
  | 'manage_settings'
  | 'view_all_data'
  | 'manage_invoices'
  | 'manage_customers'
  | 'manage_items'
  | 'view_reports'
  | 'manage_time_tracking'
  | 'manage_calendar';
