// supabase/functions/_shared/upserts.ts
import { getServiceClient } from './db.ts';

const nowISO = () => new Date().toISOString();

export async function upsertCustomer(realmId: string, cust: any) {
  const sb = getServiceClient();
  const row = {
    id: String(cust.Id),
    realm_id: realmId,
    display_name: cust.DisplayName ?? null,
    company_name: cust.CompanyName ?? null,
    primary_email_addr: cust.PrimaryEmailAddr?.Address ?? null,
    mobile_phone: cust.Mobile?.FreeFormNumber ?? null,
    primary_phone: cust.PrimaryPhone?.FreeFormNumber ?? null,
    active: cust.Active ?? true,
    balance: cust.Balance ?? 0,
    sync_token: cust.SyncToken ?? null,
    last_synced: nowISO(),
    last_updated: nowISO(),
    created_at: nowISO()
  };
  const { error } = await sb.from('quickbooks.customers').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertItem(realmId: string, item: any) {
  const sb = getServiceClient();
  const row = {
    id: String(item.Id),
    realm_id: realmId,
    name: item.Name ?? null,
    sku: item.Sku ?? null,
    description: item.Description ?? null,
    type: item.Type ?? null,
    active: item.Active ?? true,
    unit_price: item.UnitPrice ?? null,
    qty_on_hand: item.QtyOnHand ?? null,
    taxable: item.Taxable ?? null,
    sync_token: item.SyncToken ?? null,
    last_synced: nowISO(),
    last_updated: nowISO(),
    created_at: nowISO()
  };
  const { error } = await sb.from('quickbooks.items').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertInvoice(realmId: string, inv: any) {
  const sb = getServiceClient();
  const header = {
    id: String(inv.Id),
    realm_id: realmId,
    doc_number: inv.DocNumber ?? null,
    txn_date: inv.TxnDate ?? null,
    due_date: inv.DueDate ?? null,
    customer_id: inv.CustomerRef?.value ?? null,
    total_amt: inv.TotalAmt ?? 0,
    balance: inv.Balance ?? 0,
    sync_token: inv.SyncToken ?? null,
    last_synced: nowISO(),
    last_updated: nowISO(),
    created_at: nowISO()
  };
  const { error: hErr } = await sb.from('quickbooks.invoices').upsert(header, { onConflict: 'id' });
  if (hErr) throw hErr;

  if (Array.isArray(inv.Line)) {
    for (const line of inv.Line) {
      const sid = line.SalesItemLineDetail ?? {};
      const row = {
        invoice_id: String(inv.Id),
        line_num: line.LineNum ?? null,
        item_ref_id: sid.ItemRef?.value ?? null,
        item_ref_name: sid.ItemRef?.name ?? null,
        description: line.Description ?? null,
        service_date: sid.ServiceDate ?? null,
        qty: sid.Qty ?? null,
        unit_price: sid.UnitPrice ?? null,
        amount: line.Amount ?? null,
        last_synced: nowISO(),
        last_updated: nowISO(),
        created_at: nowISO()
      };
      const { error: lErr } = await sb.from('quickbooks.invoices_line_items')
        .upsert(row, { onConflict: 'invoice_id,line_num,item_ref_id' });
      if (lErr) throw lErr;
    }
  }
}

export async function upsertEstimate(realmId: string, est: any) {
  const sb = getServiceClient();
  const header = {
    id: String(est.Id),
    realm_id: realmId,
    doc_number: est.DocNumber ?? null,
    txn_date: est.TxnDate ?? null,
    expiration_date: est.ExpirationDate ?? null,
    customer_id: est.CustomerRef?.value ?? null,
    total_amt: est.TotalAmt ?? 0,
    status: est.Status ?? null,
    sync_token: est.SyncToken ?? null,
    last_synced: nowISO(),
    last_updated: nowISO(),
    created_at: nowISO()
  };
  const { error: hErr } = await sb.from('quickbooks.estimates').upsert(header, { onConflict: 'id' });
  if (hErr) throw hErr;

  if (Array.isArray(est.Line)) {
    for (const line of est.Line) {
      const sid = line.SalesItemLineDetail ?? {};
      const row = {
        estimate_id: String(est.Id),
        line_num: line.LineNum ?? null,
        item_ref_id: sid.ItemRef?.value ?? null,
        item_ref_name: sid.ItemRef?.name ?? null,
        description: line.Description ?? null,
        service_date: sid.ServiceDate ?? null,
        qty: sid.Qty ?? null,
        unit_price: sid.UnitPrice ?? null,
        amount: line.Amount ?? null,
        last_synced: nowISO(),
        last_updated: nowISO(),
        created_at: nowISO()
      };
      const { error: lErr } = await sb.from('quickbooks.estimates_line_items')
        .upsert(row, { onConflict: 'estimate_id,line_num,item_ref_id' });
      if (lErr) throw lErr;
    }
  }
}
