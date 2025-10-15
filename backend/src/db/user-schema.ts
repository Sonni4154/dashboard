import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  index,
  inet
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// 🔒 USER MANAGEMENT SCHEMA (Public Schema)
// =============================================================================

// Users table matching your public.users schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  address_line1: text('address_line1'),
  address_line2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  zip_code: text('zip_code'),
  country: text('country'),
  mobile_phone: text('mobile_phone'),
  home_phone: text('home_phone'),
  email: text('email').notNull(),
  username: text('username'),
  password_hash: text('password_hash'),
  is_admin: boolean('is_admin').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  on_leave: boolean('on_leave').default(false).notNull(),
  hours_worked_this_week: numeric('hours_worked_this_week', { precision: 10, scale: 2 }).default('0').notNull(),
  hours_worked_last_week: numeric('hours_worked_last_week', { precision: 10, scale: 2 }).default('0').notNull(),
  pay_rate: numeric('pay_rate', { precision: 10, scale: 2 }),
  admin_notes: text('admin_notes'),
  employee_notes: text('employee_notes'),
  last_login: timestamp('last_login', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  google_id: varchar('google_id', { length: 255 }),
  profile_picture: text('profile_picture')
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  usernameIdx: index('idx_users_username').on(table.username),
  googleIdIdx: index('idx_users_google_id').on(table.google_id),
  activeIdx: index('idx_users_active').on(table.is_active),
  adminIdx: index('idx_users_admin').on(table.is_admin)
}));

// Auth sessions table matching your public.auth_sessions schema
export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  session_token: text('session_token').notNull(),
  ip_address: inet('ip_address'),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  tokenIdx: index('idx_auth_sessions_token').on(table.session_token),
  userIdx: index('idx_auth_sessions_user_id').on(table.user_id),
  expiresIdx: index('idx_auth_sessions_expires').on(table.expires_at)
}));

// Time clock entries table
export const timeClockEntries = pgTable('time_clock_entries', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clock_in: timestamp('clock_in', { withTimezone: true }),
  clock_out: timestamp('clock_out', { withTimezone: true }),
  break_start: timestamp('break_start', { withTimezone: true }),
  break_end: timestamp('break_end', { withTimezone: true }),
  total_hours: numeric('total_hours', { precision: 10, scale: 2 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdx: index('idx_time_clock_user_id').on(table.user_id),
  clockInIdx: index('idx_time_clock_clock_in').on(table.clock_in),
  clockOutIdx: index('idx_time_clock_clock_out').on(table.clock_out)
}));

// Auth-related tables moved to auth-schema.ts

// KV store table for application data
export const kvStore = pgTable('kv_store_d9b518ae', {
  key: text('key').primaryKey(),
  value: text('value'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// =============================================================================
// 🔗 RELATIONS
// =============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(authSessions),
  timeClockEntries: many(timeClockEntries)
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.user_id],
    references: [users.id]
  })
}));

export const timeClockEntriesRelations = relations(timeClockEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeClockEntries.user_id],
    references: [users.id]
  })
}));

// Auth-related relations moved to auth-schema.ts

// =============================================================================
// 📝 TYPE DEFINITIONS
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
export type TimeClockEntry = typeof timeClockEntries.$inferSelect;
export type NewTimeClockEntry = typeof timeClockEntries.$inferInsert;
// Auth-related types moved to auth-schema.ts
export type KVStore = typeof kvStore.$inferSelect;
export type NewKVStore = typeof kvStore.$inferInsert;