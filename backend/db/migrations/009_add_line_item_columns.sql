-- Migration: Add missing columns to invoice_line_items, estimates_line_items, and estimates
-- Created: 2025-10-11
-- Description: The tables were created with only ID columns, this adds all necessary fields

-- ============================================================
-- ADD COLUMNS TO invoice_line_items
-- ============================================================
ALTER TABLE quickbooks.invoice_line_items 
ADD COLUMN IF NOT EXISTS invoice_id BIGINT,
ADD COLUMN IF NOT EXISTS line_num INTEGER,
ADD COLUMN IF NOT EXISTS detailtype TEXT,
ADD COLUMN IF NOT EXISTS itemref_value BIGINT,
ADD COLUMN IF NOT EXISTS itemref_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS unitprice DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS qty DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS taxcode_ref_value TEXT,
ADD COLUMN IF NOT EXISTS taxcode_ref_name TEXT,
ADD COLUMN IF NOT EXISTS clasref_value BIGINT,
ADD COLUMN IF NOT EXISTS clasref_name TEXT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- ============================================================
-- ADD COLUMNS TO estimates_line_items
-- ============================================================
ALTER TABLE quickbooks.estimates_line_items 
ADD COLUMN IF NOT EXISTS estimate_id BIGINT,
ADD COLUMN IF NOT EXISTS line_num INTEGER,
ADD COLUMN IF NOT EXISTS detailtype TEXT,
ADD COLUMN IF NOT EXISTS itemref_value BIGINT,
ADD COLUMN IF NOT EXISTS itemref_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS unitprice DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS qty DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS taxcode_ref_value TEXT,
ADD COLUMN IF NOT EXISTS taxcode_ref_name TEXT,
ADD COLUMN IF NOT EXISTS clasref_value BIGINT,
ADD COLUMN IF NOT EXISTS clasref_name TEXT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- ============================================================
-- ADD COLUMNS TO estimates
-- ============================================================
ALTER TABLE quickbooks.estimates 
ADD COLUMN IF NOT EXISTS docnumber TEXT,
ADD COLUMN IF NOT EXISTS txndate DATE,
ADD COLUMN IF NOT EXISTS expirydate DATE,
ADD COLUMN IF NOT EXISTS totalamt DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS customerref_value BIGINT,
ADD COLUMN IF NOT EXISTS customerref_name TEXT,
ADD COLUMN IF NOT EXISTS emailstatus TEXT,
ADD COLUMN IF NOT EXISTS printstatus TEXT,
ADD COLUMN IF NOT EXISTS billingaddr_line1 TEXT,
ADD COLUMN IF NOT EXISTS billingaddr_city TEXT,
ADD COLUMN IF NOT EXISTS billingaddr_countrysubdivisioncode TEXT,
ADD COLUMN IF NOT EXISTS billingaddr_postalcode TEXT,
ADD COLUMN IF NOT EXISTS billingaddr_country TEXT,
ADD COLUMN IF NOT EXISTS shippingaddr_line1 TEXT,
ADD COLUMN IF NOT EXISTS shippingaddr_city TEXT,
ADD COLUMN IF NOT EXISTS shippingaddr_countrysubdivisioncode TEXT,
ADD COLUMN IF NOT EXISTS shippingaddr_postalcode TEXT,
ADD COLUMN IF NOT EXISTS shippingaddr_country TEXT,
ADD COLUMN IF NOT EXISTS shipfromaddr_line1 TEXT,
ADD COLUMN IF NOT EXISTS shipfromaddr_city TEXT,
ADD COLUMN IF NOT EXISTS shipfromaddr_countrysubdivisioncode TEXT,
ADD COLUMN IF NOT EXISTS shipfromaddr_postalcode TEXT,
ADD COLUMN IF NOT EXISTS shipfromaddr_country TEXT,
ADD COLUMN IF NOT EXISTS sync_token TEXT,
ADD COLUMN IF NOT EXISTS sparse BOOLEAN,
ADD COLUMN IF NOT EXISTS metadata_createtime TIMESTAMP,
ADD COLUMN IF NOT EXISTS metadata_lastupdatedtime TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- ============================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================

-- Add foreign key for invoice_line_items (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoice_line_items_invoice_id_fkey'
    ) THEN
        ALTER TABLE quickbooks.invoice_line_items
        ADD CONSTRAINT invoice_line_items_invoice_id_fkey 
        FOREIGN KEY (invoice_id) REFERENCES quickbooks.invoices(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for estimates_line_items (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'estimates_line_items_estimate_id_fkey'
    ) THEN
        ALTER TABLE quickbooks.estimates_line_items
        ADD CONSTRAINT estimates_line_items_estimate_id_fkey 
        FOREIGN KEY (estimate_id) REFERENCES quickbooks.estimates(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON quickbooks.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_item ON quickbooks.invoice_line_items(itemref_value);

CREATE INDEX IF NOT EXISTS idx_estimates_line_items_estimate_id ON quickbooks.estimates_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimates_line_items_item ON quickbooks.estimates_line_items(itemref_value);

CREATE INDEX IF NOT EXISTS idx_estimates_customer ON quickbooks.estimates(customerref_value);
CREATE INDEX IF NOT EXISTS idx_estimates_date ON quickbooks.estimates(txndate);
CREATE INDEX IF NOT EXISTS idx_estimates_total ON quickbooks.estimates(totalamt);

-- ============================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE quickbooks.estimates IS 'QuickBooks estimates data synchronized from API';
COMMENT ON TABLE quickbooks.invoice_line_items IS 'Line items for QuickBooks invoices with product/service details';
COMMENT ON TABLE quickbooks.estimates_line_items IS 'Line items for QuickBooks estimates with product/service details';

COMMENT ON COLUMN quickbooks.invoice_line_items.invoice_id IS 'Foreign key to parent invoice';
COMMENT ON COLUMN quickbooks.invoice_line_items.line_num IS 'Line number within the invoice';
COMMENT ON COLUMN quickbooks.invoice_line_items.detailtype IS 'Type of line item (e.g., SalesItemLineDetail)';

COMMENT ON COLUMN quickbooks.estimates_line_items.estimate_id IS 'Foreign key to parent estimate';
COMMENT ON COLUMN quickbooks.estimates_line_items.line_num IS 'Line number within the estimate';
COMMENT ON COLUMN quickbooks.estimates_line_items.detailtype IS 'Type of line item (e.g., SalesItemLineDetail)';

