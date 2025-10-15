import { db } from '../db/index.js';
import { customers, items, invoices, estimates, invoiceLineItems, estimateLineItems } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

/**
 * Upsert customer from QuickBooks to NeonDB
 * TODO: Implement full customer upsert logic
 */
export async function upsertCustomer(cust: any) {
  logger.info(`Upserting customer: ${cust.DisplayName} (${cust.Id})`);
  // TODO: Implement upsert logic once we map all QB fields to DB schema
}

/**
 * Upsert item from QuickBooks to NeonDB
 */
export async function upsertItem(item: any, realmId: string) {
  try {
    logger.info(`Upserting item: ${item.Name || item.FullyQualifiedName} (${item.Id})`);
    
    // Extract pricing information from QuickBooks Item object - match Supabase schema
    const itemData = {
      id: String(item.Id),
      realm_id: realmId,
      name: item.Name || item.FullyQualifiedName,
      sku: item.Sku || null,
      description: item.Description || null,
      type: item.Type || null,
      active: item.Active !== undefined ? item.Active : true,
      taxable: item.Taxable || null,
      unit_price: item.UnitPrice || null,
      sales_price: item.SalesPrice || null,
      qty_on_hand: item.QtyOnHand || null,
      income_account_ref_id: item.IncomeAccountRef?.value || null,
      expense_account_ref_id: item.ExpenseAccountRef?.value || null,
      asset_account_ref_id: item.AssetAccountRef?.value || null,
      sync_token: item.SyncToken || null,
      metadata: item.MetaData ? JSON.stringify(item.MetaData) : null,
      last_synced: new Date(),
      last_updated: new Date()
    };

    await db.insert(items)
      .values(itemData)
      .onConflictDoUpdate({
        target: items.id,
        set: {
          realm_id: itemData.realm_id,
          name: itemData.name,
          sku: itemData.sku,
          description: itemData.description,
          type: itemData.type,
          active: itemData.active,
          taxable: itemData.taxable,
          unit_price: itemData.unit_price,
          sales_price: itemData.sales_price,
          qty_on_hand: itemData.qty_on_hand,
          income_account_ref_id: itemData.income_account_ref_id,
          expense_account_ref_id: itemData.expense_account_ref_id,
          asset_account_ref_id: itemData.asset_account_ref_id,
          sync_token: itemData.sync_token,
          metadata: itemData.metadata,
          last_synced: itemData.last_synced,
          last_updated: itemData.last_updated
        }
      });

    logger.info(`✅ Successfully upserted item: ${item.Name || item.FullyQualifiedName}`);
  } catch (error) {
    logger.error(`❌ Failed to upsert item ${item.Id}:`, error);
    throw error;
  }
}

/**
 * Upsert invoice from QuickBooks to NeonDB
 */
export async function upsertInvoice(inv: any, realmId: string) {
  try {
    logger.info(`Upserting invoice: ${inv.DocNumber} (${inv.Id})`);
    
    // Extract invoice data from QuickBooks Invoice object - match Supabase schema
    const invoiceData = {
      id: String(inv.Id),
      realm_id: realmId,
      doc_number: inv.DocNumber || null,
      txn_date: inv.TxnDate || null,
      due_date: inv.DueDate || null,
      customer_id: inv.CustomerRef?.value ? String(inv.CustomerRef.value) : null,
      customer_ref_name: inv.CustomerRef?.name || null,
      total_amt: inv.TotalAmt || 0,
      balance: inv.Balance || 0,
      currency_ref: inv.CurrencyRef?.value || null,
      exchange_rate: inv.ExchangeRate || null,
      bill_line1: inv.BillAddr?.Line1 || null,
      bill_line2: inv.BillAddr?.Line2 || null,
      bill_city: inv.BillAddr?.City || null,
      bill_state: inv.BillAddr?.CountrySubDivisionCode || null,
      bill_postal_code: inv.BillAddr?.PostalCode || null,
      bill_country: inv.BillAddr?.Country || null,
      ship_line1: inv.ShipAddr?.Line1 || null,
      ship_line2: inv.ShipAddr?.Line2 || null,
      ship_city: inv.ShipAddr?.City || null,
      ship_state: inv.ShipAddr?.CountrySubDivisionCode || null,
      ship_postal_code: inv.ShipAddr?.PostalCode || null,
      ship_country: inv.ShipAddr?.Country || null,
      email_status: inv.EmailStatus || null,
      print_status: inv.PrintStatus || null,
      private_note: inv.PrivateNote || null,
      memo: inv.CustomerMemo?.value || null,
      status: inv.Balance === 0 ? 'Paid' : 'Open',
      sync_token: inv.SyncToken || null,
      metadata_create_time: inv.MetaData?.CreateTime || null,
      metadata_last_updated_time: inv.MetaData?.LastUpdatedTime || null,
      last_synced: new Date(),
      last_updated: new Date()
    };

    // Insert or update invoice
    await db.insert(invoices)
      .values(invoiceData)
      .onConflictDoUpdate({
        target: invoices.id,
        set: invoiceData
      });

    // Handle line items if they exist
    if (inv.Line && Array.isArray(inv.Line)) {
      // Delete existing line items for this invoice
      await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoice_id, String(inv.Id)));
      
      // Insert new line items
      for (const line of inv.Line) {
        if (line.SalesItemLineDetail || line.DescriptionLineDetail) {
          const lineItemData = {
            invoice_id: String(inv.Id),
            line_num: line.LineNum || null,
            detail_type: line.DetailType || null,
            item_ref_id: line.SalesItemLineDetail?.ItemRef?.value ? String(line.SalesItemLineDetail.ItemRef.value) : null,
            item_ref_name: line.SalesItemLineDetail?.ItemRef?.name || null,
            description: line.Description || null,
            service_date: line.SalesItemLineDetail?.ServiceDate || null,
            qty: line.SalesItemLineDetail?.Qty || null,
            unit_price: line.SalesItemLineDetail?.UnitPrice || null,
            amount: line.Amount || null,
            tax_code_ref_id: line.SalesItemLineDetail?.TaxCodeRef?.value || null,
            tax_code_ref_name: line.SalesItemLineDetail?.TaxCodeRef?.name || null,
            class_ref_id: line.SalesItemLineDetail?.ClassRef?.value || null,
            class_ref_name: line.SalesItemLineDetail?.ClassRef?.name || null,
            last_synced: new Date(),
            last_updated: new Date()
          };

          await db.insert(invoiceLineItems).values(lineItemData);
        }
      }
    }

    logger.info(`✅ Successfully upserted invoice: ${inv.DocNumber}`);
  } catch (error) {
    logger.error(`❌ Failed to upsert invoice ${inv.Id}:`, error);
    throw error;
  }
}

/**
 * Upsert estimate from QuickBooks to NeonDB
 */
export async function upsertEstimate(est: any, realmId: string) {
  try {
    logger.info(`Upserting estimate: ${est.DocNumber} (${est.Id})`);
    
    // Extract estimate data from QuickBooks Estimate object - match Supabase schema
    const estimateData = {
      id: String(est.Id),
      realm_id: realmId,
      doc_number: est.DocNumber || null,
      txn_date: est.TxnDate || null,
      expiration_date: est.ExpirationDate || null,
      total_amt: est.TotalAmt || 0,
      status: est.TxnStatus || 'Pending',
      customer_id: est.CustomerRef?.value ? String(est.CustomerRef.value) : null,
      customer_ref_name: est.CustomerRef?.name || null,
      email_status: est.EmailStatus || null,
      print_status: est.PrintStatus || null,
      currency_ref: est.CurrencyRef?.value || null,
      exchange_rate: est.ExchangeRate || null,
      bill_line1: est.BillAddr?.Line1 || null,
      bill_line2: est.BillAddr?.Line2 || null,
      bill_city: est.BillAddr?.City || null,
      bill_state: est.BillAddr?.CountrySubDivisionCode || null,
      bill_postal_code: est.BillAddr?.PostalCode || null,
      bill_country: est.BillAddr?.Country || null,
      ship_line1: est.ShipAddr?.Line1 || null,
      ship_line2: est.ShipAddr?.Line2 || null,
      ship_city: est.ShipAddr?.City || null,
      ship_state: est.ShipAddr?.CountrySubDivisionCode || null,
      ship_postal_code: est.ShipAddr?.PostalCode || null,
      ship_country: est.ShipAddr?.Country || null,
      private_note: est.PrivateNote || null,
      memo: est.CustomerMemo?.value || null,
      sync_token: est.SyncToken || null,
      metadata_create_time: est.MetaData?.CreateTime || null,
      metadata_last_updated_time: est.MetaData?.LastUpdatedTime || null,
      last_synced: new Date(),
      last_updated: new Date()
    };

    // Insert or update estimate
    await db.insert(estimates)
      .values(estimateData)
      .onConflictDoUpdate({
        target: estimates.id,
        set: estimateData
      });

    // Handle line items if they exist
    if (est.Line && Array.isArray(est.Line)) {
      // Delete existing line items for this estimate
      await db.delete(estimateLineItems).where(eq(estimateLineItems.estimate_id, String(est.Id)));
      
      // Insert new line items
      for (const line of est.Line) {
        if (line.SalesItemLineDetail || line.DescriptionLineDetail) {
          const lineItemData = {
            estimate_id: String(est.Id),
            line_num: line.LineNum || null,
            detail_type: line.DetailType || null,
            item_ref_id: line.SalesItemLineDetail?.ItemRef?.value ? String(line.SalesItemLineDetail.ItemRef.value) : null,
            item_ref_name: line.SalesItemLineDetail?.ItemRef?.name || null,
            description: line.Description || null,
            service_date: line.SalesItemLineDetail?.ServiceDate || null,
            qty: line.SalesItemLineDetail?.Qty || null,
            unit_price: line.SalesItemLineDetail?.UnitPrice || null,
            amount: line.Amount || null,
            tax_code_ref_id: line.SalesItemLineDetail?.TaxCodeRef?.value || null,
            tax_code_ref_name: line.SalesItemLineDetail?.TaxCodeRef?.name || null,
            class_ref_id: line.SalesItemLineDetail?.ClassRef?.value || null,
            class_ref_name: line.SalesItemLineDetail?.ClassRef?.name || null,
            last_synced: new Date(),
            last_updated: new Date()
          };

          await db.insert(estimateLineItems).values(lineItemData);
        }
      }
    }

    logger.info(`✅ Successfully upserted estimate: ${est.DocNumber}`);
  } catch (error) {
    logger.error(`❌ Failed to upsert estimate ${est.Id}:`, error);
    throw error;
  }
}

/**
 * Batch upsert customers
 */
export async function batchUpsertCustomers(customersList: any[]) {
  logger.info(`Batch upserting ${customersList.length} customers...`);
  for (const customer of customersList) {
    await upsertCustomer(customer);
  }
  logger.info(`Batch upsert complete: ${customersList.length} customers`);
}

/**
 * Batch upsert items
 */
export async function batchUpsertItems(itemsList: any[], realmId: string) {
  logger.info(`Batch upserting ${itemsList.length} items...`);
  for (const item of itemsList) {
    await upsertItem(item, realmId);
  }
  logger.info(`Batch upsert complete: ${itemsList.length} items`);
}

/**
 * Batch upsert invoices
 */
export async function batchUpsertInvoices(invoicesList: any[], realmId: string) {
  logger.info(`Batch upserting ${invoicesList.length} invoices...`);
  for (const invoice of invoicesList) {
    await upsertInvoice(invoice, realmId);
  }
  logger.info(`Batch upsert complete: ${invoicesList.length} invoices`);
}

/**
 * Batch upsert estimates
 */
export async function batchUpsertEstimates(estimatesList: any[], realmId: string) {
  logger.info(`Batch upserting ${estimatesList.length} estimates...`);
  for (const estimate of estimatesList) {
    await upsertEstimate(estimate, realmId);
  }
  logger.info(`Batch upsert complete: ${estimatesList.length} estimates`);
}
