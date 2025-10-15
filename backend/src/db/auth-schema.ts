/**
 * Authentication Schema
 * 
 * Handles user authentication, permissions, and session management
 * - User permissions and roles
 * - Auth providers (Google, etc.)
 * - Verification tokens
 * - Session management
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user-schema.js';

// ================================
// USER PERMISSIONS
// ================================

export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(),
  granted_by: uuid('granted_by').references(() => users.id),
  granted_at: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdx: index('idx_user_permissions_user_id').on(table.user_id),
  permissionIdx: index('idx_user_permissions_permission').on(table.permission),
  activeIdx: index('idx_user_permissions_active').on(table.is_active)
}));

// ================================
// AUTH PROVIDERS
// ================================

export const authProviders = pgTable('auth_providers', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  provider_id: text('provider_id').notNull(),
  provider_data: text('provider_data'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdx: index('idx_auth_providers_user_id').on(table.user_id),
  providerIdx: index('idx_auth_providers_provider').on(table.provider),
  providerIdIdx: index('idx_auth_providers_provider_id').on(table.provider_id)
}));

// ================================
// AUTH VERIFICATION TOKENS
// ================================

export const authVerificationTokens = pgTable('auth_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull(),
  token_type: text('token_type').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  used_at: timestamp('used_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdx: index('idx_auth_verification_user_id').on(table.user_id),
  emailIdx: index('idx_auth_verification_email').on(table.email),
  tokenIdx: index('idx_auth_verification_token').on(table.token),
  tokenTypeIdx: index('idx_auth_verification_token_type').on(table.token_type)
}));

// ================================
// RELATIONS
// ================================

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.user_id],
    references: [users.id]
  }),
  grantedBy: one(users, {
    fields: [userPermissions.granted_by],
    references: [users.id]
  })
}));

export const authProvidersRelations = relations(authProviders, ({ one }) => ({
  user: one(users, {
    fields: [authProviders.user_id],
    references: [users.id]
  })
}));

export const authVerificationTokensRelations = relations(authVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [authVerificationTokens.user_id],
    references: [users.id]
  })
}));

// ================================
// TYPE DEFINITIONS
// ================================

export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;

export type AuthProvider = typeof authProviders.$inferSelect;
export type NewAuthProvider = typeof authProviders.$inferInsert;

export type AuthVerificationToken = typeof authVerificationTokens.$inferSelect;
export type NewAuthVerificationToken = typeof authVerificationTokens.$inferInsert;
