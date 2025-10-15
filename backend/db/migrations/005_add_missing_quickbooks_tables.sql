-- Migration: Add missing QuickBooks tables for complete data sync
-- Created: 2025-01-11
-- Description: Adds estimates, invoices_line_items, and estimates_line_items tables

-- Create estimates table
CREATE TABLE IF NOT EXISTS quickbooks.estimates (
    id BIGINT PRIMARY KEY,
    docnumber TEXT,
    txndate DATE,
    expirydate DATE,
    totalamt DOUBLE PRECISION,
    customerref_value BIGINT,
    customerref_name TEXT,
    emailstatus TEXT,
    printstatus TEXT,
    billingaddr_line1 TEXT,
    billingaddr_city TEXT,
    billingaddr_countrysubdivisioncode TEXT,
    billingaddr_postalcode TEXT,
    billingaddr_country TEXT,
    shippingaddr_line1 TEXT,
    shippingaddr_city TEXT,
    shippingaddr_countrysubdivisioncode TEXT,
    shippingaddr_postalcode TEXT,
    shippingaddr_country TEXT,
    shipfromaddr_line1 TEXT,
    shipfromaddr_city TEXT,
    shipfromaddr_countrysubdivisioncode TEXT,
    shipfromaddr_postalcode TEXT,
    shipfromaddr_country TEXT,
    sync_token TEXT,
    sparse BOOLEAN,
    metadata_createtime TIMESTAMP,
    metadata_lastupdatedtime TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create invoices_line_items table
CREATE TABLE IF NOT EXISTS quickbooks.invoices_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES quickbooks.invoices(id) ON DELETE CASCADE,
    line_num INTEGER,
    detailtype TEXT,
    itemref_value BIGINT,
    itemref_name TEXT,
    description TEXT,
    unitprice DOUBLE PRECISION,
    qty DOUBLE PRECISION,
    amount DOUBLE PRECISION,
    taxcode_ref_value TEXT,
    taxcode_ref_name TEXT,
    clasref_value BIGINT,
    clasref_name TEXT,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create estimates_line_items table
CREATE TABLE IF NOT EXISTS quickbooks.estimates_line_items (
    id SERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL REFERENCES quickbooks.estimates(id) ON DELETE CASCADE,
    line_num INTEGER,
    detailtype TEXT,
    itemref_value BIGINT,
    itemref_name TEXT,
    description TEXT,
    unitprice DOUBLE PRECISION,
    qty DOUBLE PRECISION,
    amount DOUBLE PRECISION,
    taxcode_ref_value TEXT,
    taxcode_ref_name TEXT,
    clasref_value BIGINT,
    clasref_name TEXT,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to items table for pricing
ALTER TABLE quickbooks.items 
ADD COLUMN IF NOT EXISTS unitprice DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS qtyonhand DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS invstartdate DATE,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS taxable BOOLEAN,
ADD COLUMN IF NOT EXISTS salesprice DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS incomeaccountref_value BIGINT,
ADD COLUMN IF NOT EXISTS incomeaccountref_name TEXT,
ADD COLUMN IF NOT EXISTS expenseaccountref_value BIGINT,
ADD COLUMN IF NOT EXISTS expenseaccountref_name TEXT,
ADD COLUMN IF NOT EXISTS assetaccountref_value BIGINT,
ADD COLUMN IF NOT EXISTS assetaccountref_name TEXT;

-- Create indexes for better performance (after tables are created)
-- These will be created in a separate migration after tables exist

-- Add comments for documentation
COMMENT ON TABLE quickbooks.estimates IS 'QuickBooks estimates data synchronized from API';
COMMENT ON TABLE quickbooks.invoices_line_items IS 'Line items for QuickBooks invoices';
COMMENT ON TABLE quickbooks.estimates_line_items IS 'Line items for QuickBooks estimates';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quickbooks.estimates TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quickbooks.invoices_line_items TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quickbooks.estimates_line_items TO your_app_user;
