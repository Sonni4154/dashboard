import {
  pgTable, serial, text, integer, timestamp, jsonb, index, uniqueIndex, numeric, boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Adjust these imports to your project
import { employees } from './employees';            // must have id, email at minimum
// import { timeEntries } from './timeEntries';     // optional type-use only if you already have it

export const employeeIdentities = pgTable('employee_identities', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),                 // 'jibble' | 'directory' | 'jotform' | ...
  externalId: text('external_id').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
}, (t) => ({
  uniqProviderExternal: uniqueIndex('employee_identities_provider_external_uniq').on(t.provider, t.externalId),
  idxEmail: index('employee_identities_email_idx').on(t.email),
  idxEmployeeProvider: index('employee_identities_employee_provider_idx').on(t.employeeId, t.provider),
}));

export const jibbleCredentials = pgTable('jibble_credentials', {
  id: serial('id').primaryKey(),
  orgId: text('org_id').notNull(),                      // maps to JIBBLE_ORG_ID
  accessTokenEnc: text('access_token_enc').notNull(),   // AES-GCM encrypted JSON { token, iv, tag }
  refreshTokenEnc: text('refresh_token_enc').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  authorizedBy: integer('authorized_by').references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
}, (t) => ({
  uniqOrg: uniqueIndex('jibble_credentials_org_uniq').on(t.orgId),
}));

export const jibbleLogs = pgTable('jibble_logs', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id, { onDelete: 'set null' }),
  jibbleId: text('jibble_id').notNull(),
  clockIn: timestamp('clock_in', { withTimezone: true, mode: 'date' }).notNull(),
  clockOut: timestamp('clock_out', { withTimezone: true, mode: 'date' }),
  location: text('location'),
  verificationMethod: text('verification_method'),      // e.g., 'face', 'gps', 'mobile', 'web'
  gpsLat: numeric('gps_lat', { precision: 9, scale: 6 }),
  gpsLng: numeric('gps_lng', { precision: 9, scale: 6 }),
  checkinPhotoUrl: text('checkin_photo_url'),
  syncedAt: timestamp('synced_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
}, (t) => ({
  uniqJibbleId: uniqueIndex('jibble_logs_jibble_id_uniq').on(t.jibbleId),
  idxEmployeeTime: index('jibble_logs_employee_time_idx').on(t.employeeId, t.clockIn, t.clockOut),
}));

export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  integration: text('integration').notNull(),           // 'jibble' | 'jotform' | 'directory'
  status: text('status').notNull(),                     // 'success' | 'partial' | 'error'
  runAt: timestamp('run_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  durationMs: integer('duration_ms'),
  itemCount: integer('item_count'),
  message: text('message'),
  details: jsonb('details'),
});

export const jotformSubmissions = pgTable('jotform_submissions', {
  id: serial('id').primaryKey(),
  formId: text('form_id').notNull(),
  submissionId: text('submission_id').notNull(),
  employeeId: integer('employee_id').references(() => employees.id, { onDelete: 'set null' }),
  receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  payload: jsonb('payload').notNull(),
}, (t) => ({
  uniqSubmission: uniqueIndex('jotform_submissions_submission_uniq').on(t.submissionId),
  idxFormReceived: index('jotform_submissions_form_received_idx').on(t.formId, t.receivedAt),
}));

export const webhookOutbox = pgTable('webhook_outbox', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),              // 'jibble.discrepancy' | ...
  payload: jsonb('payload').notNull(),
  targetUrl: text('target_url').notNull(),
  status: text('status').default('pending'),            // 'pending' | 'sent' | 'failed'
  attempts: integer('attempts').default(0),
  lastError: text('last_error'),
  queuedAt: timestamp('queued_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
});