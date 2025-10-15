/**
 * Organized Database Schema
 * 
 * This file reorganizes the database schema into logical schemas:
 * - google: Google Calendar events and related data
 * - employee: Employee management and availability
 * - time_clock: Time tracking and suspicious activity monitoring
 * - quickbooks: QuickBooks integration (existing)
 */

import {
  pgSchema,
  varchar,
  text,
  doublePrecision,
  integer,
  timestamp,
  boolean,
  json,
  bigint,
  index,
  date,
  serial,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================
// SCHEMA DEFINITIONS
// ================================

const qb = pgSchema('quickbooks');     // QuickBooks integration
const google = pgSchema('google');     // Google Calendar events
const employee = pgSchema('employee'); // Employee management
const time_clock = pgSchema('time_clock'); // Time tracking

// ================================
// ENUMS
// ================================

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
]);

export const employeeRoleEnum = pgEnum('employee_role', [
  'admin',
  'manager',
  'technician',
  'trainee'
]);

// ================================
// GOOGLE SCHEMA - Calendar Events
// ================================

export const calendarEvents = google.table('events', {
  id: serial('id').primaryKey(),
  google_event_id: varchar('google_event_id', { length: 255 }).notNull().unique(),
  google_calendar_id: varchar('google_calendar_id', { length: 255 }).notNull(),
  
  // Event details
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  location: text('location'),
  
  // Time
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  all_day: boolean('all_day').default(false),
  
  // Customer info (parsed from event)
  customer_name: varchar('customer_name', { length: 255 }),
  customer_phone: varchar('customer_phone', { length: 50 }),
  customer_email: varchar('customer_email', { length: 255 }),
  customer_address: text('customer_address'),
  
  // QuickBooks link (optional)
  qb_customer_id: integer('qb_customer_id'),
  
  // Service details
  service_type: varchar('service_type', { length: 100 }), // Insect Control, Rodent, Termite, etc.
  calendar_color: varchar('calendar_color', { length: 50 }),
  
  // Status
  status: varchar('status', { length: 50 }).default('scheduled'),
  cancelled: boolean('cancelled').default(false),
  
  // Sync metadata
  last_synced: timestamp('last_synced').defaultNow(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  googleEventIdx: index('google_events_google_event_idx').on(table.google_event_id),
  startTimeIdx: index('google_events_start_time_idx').on(table.start_time),
  serviceTypeIdx: index('google_events_service_type_idx').on(table.service_type),
}));

export const workAssignments = google.table('work_assignments', {
  id: serial('id').primaryKey(),
  calendar_event_id: integer('calendar_event_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  
  // Assignment details
  assigned_by: integer('assigned_by'), // Employee ID of admin who assigned
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
  
  // Ordering (for service route)
  sequence_order: integer('sequence_order'), // 1, 2, 3... for the day
  
  // Status
  status: assignmentStatusEnum('status').default('assigned').notNull(),
  
  // Completion tracking
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  
  // Notes
  admin_notes: text('admin_notes'), // Notes from admin when assigning
  employee_notes: text('employee_notes'), // Notes from employee after completion
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  eventIdx: index('google_assignments_event_idx').on(table.calendar_event_id),
  employeeIdx: index('google_assignments_employee_idx').on(table.employee_id),
  dateIdx: index('google_assignments_date_idx').on(table.assigned_at),
  statusIdx: index('google_assignments_status_idx').on(table.status),
}));

// ================================
// EMPLOYEE SCHEMA - Employee Management
// ================================

export const employees = employee.table('employees', {
  id: serial('id').primaryKey(),
  stack_user_id: varchar('stack_user_id', { length: 100 }).unique(), // Link to Stack Auth
  email: varchar('email', { length: 255 }).notNull().unique(),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: employeeRoleEnum('role').default('technician').notNull(),
  active: boolean('active').default(true).notNull(),
  
  // Compensation
  hourly_rate: doublePrecision('hourly_rate').default(25.0).notNull(),
  
  // Availability
  default_start_time: varchar('default_start_time', { length: 10 }).default('09:00'), // "HH:MM" format
  default_end_time: varchar('default_end_time', { length: 10 }).default('17:00'),
  
  // Metadata
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('employee_employees_email_idx').on(table.email),
  activeIdx: index('employee_employees_active_idx').on(table.active),
}));

export const employeeAvailability = employee.table('availability', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  
  // Date
  date: timestamp('date').notNull(), // Specific date
  
  // Time range
  start_time: varchar('start_time', { length: 10 }).notNull(), // "HH:MM"
  end_time: varchar('end_time', { length: 10 }).notNull(),
  
  // Status
  available: boolean('available').default(true),
  reason: text('reason'), // If unavailable: "PTO", "Sick", "Training", etc.
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: index('employee_availability_employee_date_idx').on(table.employee_id, table.date),
}));

export const internalNotes = employee.table('internal_notes', {
  id: serial('id').primaryKey(),
  
  // What the note is about
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // 'customer', 'job', 'employee', 'general'
  entity_id: varchar('entity_id', { length: 100 }), // ID of related entity (QB customer ID, employee ID, etc.)
  
  // Note content
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  
  // Categorization
  category: varchar('category', { length: 50 }), // 'important', 'followup', 'issue', 'general'
  priority: varchar('priority', { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  
  // Pinning & visibility
  pinned: boolean('pinned').default(false),
  visible_to_all: boolean('visible_to_all').default(false), // If false, only admins see it
  
  // Author
  created_by: integer('created_by').notNull(), // Employee ID
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('employee_notes_entity_idx').on(table.entity_type, table.entity_id),
  categoryIdx: index('employee_notes_category_idx').on(table.category),
  createdByIdx: index('employee_notes_created_by_idx').on(table.created_by),
  pinnedIdx: index('employee_notes_pinned_idx').on(table.pinned),
}));

// ================================
// TIME_CLOCK SCHEMA - Time Tracking
// ================================

export const timeEntries = time_clock.table('time_entries', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  
  // Clock in/out times
  clock_in: timestamp('clock_in').defaultNow().notNull(),
  clock_out: timestamp('clock_out'),
  
  // Duration (calculated on clock out)
  duration_minutes: integer('duration_minutes'),
  
  // Device/Location tracking
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  clock_in_location: text('clock_in_location'),
  clock_out_location: text('clock_out_location'),
  
  // Suspicious activity flagging (silent to employee)
  flagged: boolean('flagged').default(false),
  flag_reason: text('flag_reason'), // e.g., "Late night clock-in", "Duplicate IP"
  
  // Notes
  notes: text('notes'),
  
  // Approval (for payroll)
  approved: boolean('approved').default(false),
  approved_by: integer('approved_by'),
  approved_at: timestamp('approved_at'),
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index('time_clock_employee_idx').on(table.employee_id),
  clockInIdx: index('time_clock_clock_in_idx').on(table.clock_in),
  flaggedIdx: index('time_clock_flagged_idx').on(table.flagged),
  approvedIdx: index('time_clock_approved_idx').on(table.approved),
}));

export const suspiciousTerms = time_clock.table('suspicious_terms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  
  // Rule configuration (JSON for flexibility)
  rule_config: json('rule_config'), // e.g., { "time_range": ["00:00", "04:00"], "type": "late_night" }
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('time_clock_suspicious_active_idx').on(table.active),
}));

// ================================
// QUICKBOOKS SCHEMA (Existing)
// ================================

// Import existing QuickBooks tables (we'll keep these as-is)
export const tokens = qb.table('tokens', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().notNull(),
  accessToken: text('accessToken').notNull(),
  refreshToken: text('refreshToken'),
  realmId: text('realmId'),
  expiresAt: timestamp('expiresAt'),
  createdAt: timestamp('createdAt').defaultNow(),
  lastUpdated: timestamp('lastUpdated').defaultNow()
});

export const customers = qb.table('customers', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  displayname: text('displayname'),
  companyname: text('companyname'),
  printoncheckname: text('printoncheckname'),
  active: boolean('active'),
  primaryphone_freeformnumber: text('primaryphone_freeformnumber'),
  primaryemailaddr_address: text('primaryemailaddr_address'),
  mobile_freeformnumber: text('mobile_freeformnumber'),
  fax_freeformnumber: text('fax_freeformnumber'),
  alternatephone_freeformnumber: text('alternatephone_freeformnumber'),
  webaddr_uri: text('webaddr_uri'),
  taxable: boolean('taxable'),
  balance: doublePrecision('balance'),
  balancewithjobs: doublePrecision('balancewithjobs'),
  last_updated: timestamp('last_updated').defaultNow()
});

export const items = qb.table('items', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  name: text('name'),
  fully_qualified_name: text('fully_qualified_name'),
  sku: text('sku'),
  description: text('description'),
  unitprice: doublePrecision('unitprice'),
  qtyonhand: doublePrecision('qtyonhand'),
  invstartdate: date('invstartdate'),
  type: text('type'),
  taxable: boolean('taxable'),
  salesprice: doublePrecision('salesprice'),
  incomeaccountref_value: text('incomeaccountref_value'),
  incomeaccountref_name: text('incomeaccountref_name'),
  expenseaccountref_value: text('expenseaccountref_value'),
  expenseaccountref_name: text('expenseaccountref_name'),
  assetaccountref_value: text('assetaccountref_value'),
  assetaccountref_name: text('assetaccountref_name'),
  last_updated: timestamp('last_updated').defaultNow()
});

export const invoices = qb.table('invoices', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  docnumber: text('docnumber'),
  txndate: date('txndate'),
  duedate: date('duedate'),
  totalamt: doublePrecision('totalamt'),
  balance: doublePrecision('balance'),
  customerref_value: text('customerref_value'),
  customerref_name: text('customerref_name'),
  customermemo_value: text('customermemo_value'),
  synctoken: text('synctoken'),
  metadata_createtime: timestamp('metadata_createtime'),
  metadata_lastupdatedtime: timestamp('metadata_lastupdatedtime'),
  metadata_lastmodifiedbyref_value: text('metadata_lastmodifiedbyref_value'),
  currencyref_value: text('currencyref_value'),
  currencyref_name: text('currencyref_name'),
  billemail_address: text('billemail_address'),
  billemailcc_address: text('billemailcc_address'),
  billemailbcc_address: text('billemailbcc_address'),
  emailstatus: text('emailstatus'),
  printstatus: text('printstatus'),
  billaddr_id: text('billaddr_id'),
  billaddr_line1: text('billaddr_line1'),
  billaddr_line2: text('billaddr_line2'),
  billaddr_city: text('billaddr_city'),
  billaddr_country: text('billaddr_country'),
  billaddr_countrysubdivisioncode: text('billaddr_countrysubdivisioncode'),
  billaddr_postalcode: text('billaddr_postalcode'),
  shipaddr_id: text('shipaddr_id'),
  shipaddr_line1: text('shipaddr_line1'),
  shipaddr_line2: text('shipaddr_line2'),
  shipaddr_city: text('shipaddr_city'),
  shipaddr_country: text('shipaddr_country'),
  shipaddr_countrysubdivisioncode: text('shipaddr_countrysubdivisioncode'),
  shipaddr_postalcode: text('shipaddr_postalcode'),
  salestermref_value: text('salestermref_value'),
  salestermref_name: text('salestermref_name'),
  domain: text('domain'),
  sparse: boolean('sparse'),
  allowipnpayment: boolean('allowipnpayment'),
  allowonlinepayment: boolean('allowonlinepayment'),
  allowonlinecreditcardpayment: boolean('allowonlinecreditcardpayment'),
  allowonlineachpayment: boolean('allowonlineachpayment'),
  applytaxafterdiscount: boolean('applytaxafterdiscount'),
  privatenote: text('privatenote'),
  notes: text('notes'),
  last_updated: timestamp('last_updated').defaultNow()
});

export const estimates = qb.table('estimates', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  docnumber: text('docnumber'),
  txndate: date('txndate'),
  expirydate: date('expirydate'),
  totalamt: doublePrecision('totalamt'),
  customerref_value: text('customerref_value'),
  customerref_name: text('customerref_name'),
  emailstatus: text('emailstatus'),
  printstatus: text('printstatus'),
  billingaddr_line1: text('billingaddr_line1'),
  billingaddr_city: text('billingaddr_city'),
  billingaddr_countrysubdivisioncode: text('billingaddr_countrysubdivisioncode'),
  billingaddr_postalcode: text('billingaddr_postalcode'),
  billingaddr_country: text('billingaddr_country'),
  shippingaddr_line1: text('shippingaddr_line1'),
  shippingaddr_city: text('shippingaddr_city'),
  shippingaddr_countrysubdivisioncode: text('shippingaddr_countrysubdivisioncode'),
  shippingaddr_postalcode: text('shippingaddr_postalcode'),
  shippingaddr_country: text('shippingaddr_country'),
  shipfromaddr_line1: text('shipfromaddr_line1'),
  shipfromaddr_city: text('shipfromaddr_city'),
  shipfromaddr_countrysubdivisioncode: text('shipfromaddr_countrysubdivisioncode'),
  shipfromaddr_postalcode: text('shipfromaddr_postalcode'),
  shipfromaddr_country: text('shipfromaddr_country'),
  sync_token: text('sync_token'),
  sparse: boolean('sparse'),
  metadata_createtime: timestamp('metadata_createtime'),
  metadata_lastupdatedtime: timestamp('metadata_lastupdatedtime'),
  last_updated: timestamp('last_updated').defaultNow()
});

export const invoiceLineItems = qb.table('invoices_line_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  invoice_id: bigint('invoice_id', { mode: 'number' }).notNull(),
  line_num: integer('line_num'),
  detailtype: text('detailtype'),
  itemref_value: text('itemref_value'),
  itemref_name: text('itemref_name'),
  description: text('description'),
  unitprice: doublePrecision('unitprice'),
  qty: doublePrecision('qty'),
  amount: doublePrecision('amount'),
  taxcode_ref_value: text('taxcode_ref_value'),
  taxcode_ref_name: text('taxcode_ref_name'),
  clasref_value: text('clasref_value'),
  clasref_name: text('clasref_name'),
  last_updated: timestamp('last_updated').defaultNow()
});

export const estimateLineItems = qb.table('estimates_line_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  estimate_id: bigint('estimate_id', { mode: 'number' }).notNull(),
  line_num: integer('line_num'),
  detailtype: text('detailtype'),
  itemref_value: text('itemref_value'),
  itemref_name: text('itemref_name'),
  description: text('description'),
  unitprice: doublePrecision('unitprice'),
  qty: doublePrecision('qty'),
  amount: doublePrecision('amount'),
  taxcode_ref_value: text('taxcode_ref_value'),
  taxcode_ref_name: text('taxcode_ref_name'),
  clasref_value: text('clasref_value'),
  clasref_name: text('clasref_name'),
  last_updated: timestamp('last_updated').defaultNow()
});

// ================================
// RELATIONS
// ================================

export const employeesRelations = relations(employees, ({ many }) => ({
  workAssignments: many(workAssignments),
  availability: many(employeeAvailability),
  notesCreated: many(internalNotes),
  timeEntries: many(timeEntries),
  assignmentsMade: many(workAssignments, { relationName: 'assignedBy' }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ many }) => ({
  assignments: many(workAssignments),
}));

export const workAssignmentsRelations = relations(workAssignments, ({ one }) => ({
  calendarEvent: one(calendarEvents, {
    fields: [workAssignments.calendar_event_id],
    references: [calendarEvents.id],
  }),
  employee: one(employees, {
    fields: [workAssignments.employee_id],
    references: [employees.id],
  }),
  assignedByEmployee: one(employees, {
    fields: [workAssignments.assigned_by],
    references: [employees.id],
    relationName: 'assignedBy',
  }),
}));

export const employeeAvailabilityRelations = relations(employeeAvailability, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeAvailability.employee_id],
    references: [employees.id],
  }),
}));

export const internalNotesRelations = relations(internalNotes, ({ one }) => ({
  createdBy: one(employees, {
    fields: [internalNotes.created_by],
    references: [employees.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employee_id],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [timeEntries.approved_by],
    references: [employees.id],
  }),
}));
