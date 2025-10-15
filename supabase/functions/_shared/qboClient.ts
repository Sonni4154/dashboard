// supabase/functions/_shared/qboClient.ts
import { getServiceClient } from './db.ts';

type TokenRow = {
  id: number;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string | null;
  environment: string | null;
  is_active: boolean;
  last_updated?: string | null;
};

export async function getActiveToken(realmId?: string): Promise<TokenRow | null> {
  const sb = getServiceClient();
  let q = sb.from('quickbooks.tokens').select('*').eq('is_active', true).order('last_updated', { ascending: false }).limit(1);
  if (realmId) q = q.eq('realm_id', realmId);
  const { data, error } = await q;
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function fetchQboById(realmId: string, entity: string, id: string) {
  const token = await getActiveToken(realmId);
  if (!token) throw new Error('No active token for realm ' + realmId);
  const base = Deno.env.get('QBO_BASE_URL') || 'https://quickbooks.api.intuit.com/v3/company';
  const url = `${base}/${realmId}/${entity.toLowerCase()}/${id}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token.access_token}`, 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`QBO fetch failed: ${res.status}`);
  const json = await res.json();
  return json[entity] || json;
}

export async function runCdc(realmId: string, changedSinceISO: string) {
  const token = await getActiveToken(realmId);
  if (!token) throw new Error('No active token for realm ' + realmId);
  const base = Deno.env.get('QBO_BASE_URL') || 'https://quickbooks.api.intuit.com/v3/company';
  const url = `${base}/${realmId}/cdc?entities=Customer,Item,Invoice,Estimate&changedSince=${encodeURIComponent(changedSinceISO)}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token.access_token}`, 'Content-Type': 'text/plain' } });
  if (!res.ok) throw new Error(`CDC failed: ${res.status}`);
  return await res.json();
}
