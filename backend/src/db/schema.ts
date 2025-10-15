import {
  pgTable,
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
  serial
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const qb = pgSchema('quickbooks');

/* -----------------------------
   TOKENS (OAuth 2.0)
   QuickBooks OAuth 2.0 Complete Implementation
   ✅ Updated to match Supabase schema exactly
----------------------------- */
export const tokens = qb.table('tokens', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().notNull(),
  realm_id: text('realm_id').notNull(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  token_type: text('token_type'),
  scope: text('scope'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  refresh_token_expires_at: timestamp('refresh_token_expires_at', { withTimezone: true }),
  environment: text('environment'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

/* -----------------------------
   CUSTOMERS
   ✅ Updated to match Supabase schema exactly
----------------------------- */
export const customers = qb.table('customers', {
  id: text('id').primaryKey().notNull(),
  realm_id: text('realm_id').notNull(),
  display_name: text('display_name').notNull(),
  given_name: text('given_name'),
  family_name: text('family_name'),
  company_name: text('company_name'),
  primary_email_addr: text('primary_email_addr'),
  mobile_phone: text('mobile_phone'),
  primary_phone: text('primary_phone'),
  alternate_phone: text('alternate_phone'),
  fax: text('fax'),
  website: text('website'),
  bill_line1: text('bill_line1'),
  bill_line2: text('bill_line2'),
  bill_city: text('bill_city'),
  bill_state: text('bill_state'),
  bill_postal_code: text('bill_postal_code'),
  bill_country: text('bill_country'),
  ship_line1: text('ship_line1'),
  ship_line2: text('ship_line2'),
  ship_city: text('ship_city'),
  ship_state: text('ship_state'),
  ship_postal_code: text('ship_postal_code'),
  ship_country: text('ship_country'),
  taxable: boolean('taxable'),
  balance: doublePrecision('balance').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  sync_token: text('sync_token'),
  metadata: json('metadata'),
  last_synced: timestamp('last_synced', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

/* -----------------------------
   ITEMS
   ✅ Updated to match Supabase schema exactly
----------------------------- */
export const items = qb.table('items', {
  id: text('id').primaryKey().notNull(),
  realm_id: text('realm_id').notNull(),
  name: text('name').notNull(),
  sku: text('sku'),
  description: text('description'),
  type: text('type'),
  active: boolean('active').default(true).notNull(),
  taxable: boolean('taxable'),
  unit_price: doublePrecision('unit_price'),
  sales_price: doublePrecision('sales_price'),
  qty_on_hand: doublePrecision('qty_on_hand'),
  income_account_ref_id: text('income_account_ref_id'),
  expense_account_ref_id: text('expense_account_ref_id'),
  asset_account_ref_id: text('asset_account_ref_id'),
  sync_token: text('sync_token'),
  metadata: json('metadata'),
  last_synced: timestamp('last_synced', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

/* -----------------------------
   INVOICES
   ✅ Updated to match Supabase schema exactly
----------------------------- */
export const invoices = qb.table('invoices', {
  id: text('id').primaryKey().notNull(),
  realm_id: text('realm_id').notNull(),
  doc_number: text('doc_number'),
  txn_date: date('txn_date'),
  due_date: date('due_date'),
  customer_id: text('customer_id'),
  customer_ref_name: text('customer_ref_name'),
  total_amt: doublePrecision('total_amt').default(0).notNull(),
  balance: doublePrecision('balance').default(0).notNull(),
  currency_ref: text('currency_ref'),
  exchange_rate: doublePrecision('exchange_rate'),
  bill_line1: text('bill_line1'),
  bill_line2: text('bill_line2'),
  bill_city: text('bill_city'),
  bill_state: text('bill_state'),
  bill_postal_code: text('bill_postal_code'),
  bill_country: text('bill_country'),
  ship_line1: text('ship_line1'),
  ship_line2: text('ship_line2'),
  ship_city: text('ship_city'),
  ship_state: text('ship_state'),
  ship_postal_code: text('ship_postal_code'),
  ship_country: text('ship_country'),
  email_status: text('email_status'),
  print_status: text('print_status'),
  private_note: text('private_note'),
  memo: text('memo'),
  status: text('status'),
  sync_token: text('sync_token'),
  metadata_create_time: timestamp('metadata_create_time', { withTimezone: true }),
  metadata_last_updated_time: timestamp('metadata_last_updated_time', { withTimezone: true }),
  last_synced: timestamp('last_synced', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

/* -----------------------------
   ESTIMATES
   ✅ Updated to match Supabase schema exactly
----------------------------- */
export const estimates = qb.table('estimates', {
  id: text('id').primaryKey().notNull(),
  realm_id: text('realm_id').notNull(),
  doc_number: text('doc_number'),
  txn_date: date('txn_date'),
  expiration_date: date('expiration_date'),
  total_amt: doublePrecision('total_amt').default(0).notNull(),
  status: text('status'),
  customer_id: text('customer_id'),
  customer_ref_name: text('customer_ref_name'),
  email_status: text('email_status'),
  print_status: text('print_status'),
  currency_ref: text('currency_ref'),
  exchange_rate: doublePrecision('exchange_rate'),
  bill_line1: text('bill_line1'),
  bill_line2: text('bill_line2'),
  bill_city: text('bill_city'),
  bill_state: text('bill_state'),
  bill_postal_code: text('bill_postal_code'),
  bill_country: text('bill_country'),
  ship_line1: text('ship_line1'),
  ship_line2: text('ship_line2'),
  ship_city: text('ship_city'),
  ship_state: text('ship_state'),
  ship_postal_code: text('ship_postal_code'),
  ship_country: text('ship_country'),
  private_note: text('private_note'),
  memo: text('memo'),
  sync_token: text('sync_token'),
  metadata_create_time: timestamp('metadata_create_time', { withTimezone: true }),
  metadata_last_updated_time: timestamp('metadata_last_updated_time', { withTimezone: true }),
  last_synced: timestamp('last_synced', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

/* -----------------------------
   LINE ITEMS
   ✅ Updated to match Supabase schema exactly
----------------------------- */
export const invoiceLineItems = qb.table('invoices_line_items', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().notNull(),
  invoice_id: text('invoice_id').notNull(),
  line_num: integer('line_num'),
  detail_type: text('detail_type'),
  item_ref_id: text('item_ref_id'),
  item_ref_name: text('item_ref_name'),
  description: text('description'),
  service_date: date('service_date'),
  qty: doublePrecision('qty'),
  unit_price: doublePrecision('unit_price'),
  amount: doublePrecision('amount'),
  tax_code_ref_id: text('tax_code_ref_id'),
  tax_code_ref_name: text('tax_code_ref_name'),
  class_ref_id: text('class_ref_id'),
  class_ref_name: text('class_ref_name'),
  last_synced: timestamp('last_synced', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

export const estimateLineItems = qb.table('estimates_line_items', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().notNull(),
  estimate_id: text('estimate_id').notNull(),
  line_num: integer('line_num'),
  detail_type: text('detail_type'),
  item_ref_id: text('item_ref_id'),
  item_ref_name: text('item_ref_name'),
  description: text('description'),
  service_date: date('service_date'),
  qty: doublePrecision('qty'),
  unit_price: doublePrecision('unit_price'),
  amount: doublePrecision('amount'),
  tax_code_ref_id: text('tax_code_ref_id'),
  tax_code_ref_name: text('tax_code_ref_name'),
  class_ref_id: text('class_ref_id'),
  class_ref_name: text('class_ref_name'),
  last_synced: timestamp('last_synced', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

/* -----------------------------
   RELATIONS
   ✅ Updated to match new column names
----------------------------- */
export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
  estimates: many(estimates)
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customer_id],
    references: [customers.id]
  }),
  lineItems: many(invoiceLineItems)
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoice_id],
    references: [invoices.id]
  }),
  item: one(items, {
    fields: [invoiceLineItems.item_ref_id],
    references: [items.id]
  })
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  customer: one(customers, {
    fields: [estimates.customer_id],
    references: [customers.id]
  }),
  lineItems: many(estimateLineItems)
}));

export const estimateLineItemsRelations = relations(estimateLineItems, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateLineItems.estimate_id],
    references: [estimates.id]
  }),
  item: one(items, {
    fields: [estimateLineItems.item_ref_id],
    references: [items.id]
  })
}));
