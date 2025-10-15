// supabase/functions/_shared/sync.ts
import { getServiceClient } from './db.ts';
import { runCdc } from './qboClient.ts';
import { upsertCustomer, upsertItem, upsertInvoice, upsertEstimate } from './upserts.ts';

export async function getActiveRealms(): Promise<string[]> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('quickbooks.tokens').select('realm_id').eq('is_active', true);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data || []) set.add(r.realm_id);
  return [...set];
}

export async function writeSyncHeartbeat(meta: Record<string, unknown>) {
  const sb = getServiceClient();
  const { error } = await sb.from('dashboard.logs').insert({
    id: crypto.randomUUID(),
    event_type: 'sync.heartbeat',
    severity: 'info',
    message: 'Scheduled CDC heartbeat',
    meta,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  });
  if (error) throw error;
}

export async function runCdcForRealm(realmId: string) {
  const sb = getServiceClient();
  const { data: state } = await sb.from('quickbooks.sync_state').select('*').eq('tenant_id', realmId).single();
  const since = new Date((state?.last_cdc_at ? Date.parse(state.last_cdc_at) : Date.now() - 60*60*1000) - 10*60*1000).toISOString();

  const result = await runCdc(realmId, since);
  const r = result?.CDCResponse?.[0] ?? {};
  const resp = r.QueryResponse ?? {};

  for (const c of (resp.Customer || [])) await upsertCustomer(realmId, c);
  for (const it of (resp.Item || [])) await upsertItem(realmId, it);
  for (const iv of (resp.Invoice || [])) await upsertInvoice(realmId, iv);
  for (const es of (resp.Estimate || [])) await upsertEstimate(realmId, es);

  await sb.from('quickbooks.sync_state').upsert({
    tenant_id: realmId,
    last_cdc_at: new Date().toISOString(),
    created_at: state?.created_at ?? new Date().toISOString(),
    last_updated: new Date().toISOString()
  }, { onConflict: 'tenant_id' });
}
