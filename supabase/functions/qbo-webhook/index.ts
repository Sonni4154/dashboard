// supabase/functions/qbo-webhook/index.ts
import { fetchQboById } from '../_shared/qboClient.ts';
import { upsertCustomer, upsertItem, upsertInvoice, upsertEstimate } from '../_shared/upserts.ts';

async function verifyIntuitSignature(rawBody: string, received: string): Promise<boolean> {
  const key = Deno.env.get('QBO_WEBHOOK_KEY')!;
  const enc = new TextEncoder();
  const algo = { name: 'HMAC', hash: 'SHA-256' } as HmacImportParams;
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), algo, false, ['sign']);
  const sigBuf = await crypto.subtle.sign(algo.name, cryptoKey, enc.encode(rawBody));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return b64 === received;
}

Deno.serve(async (req) => {
  const raw = await req.text();
  const sig = req.headers.get('intuit-signature') ?? '';
  const ok = await verifyIntuitSignature(raw, sig);
  if (!ok) return new Response('invalid signature', { status: 401 });

  const body = JSON.parse(raw);
  for (const n of body.eventNotifications ?? []) {
    const realmId = n.realmId;
    for (const e of n.dataChangeEvent?.entities ?? []) {
      const name = e.name as string;
      const id = e.id as string;
      const full = await fetchQboById(realmId, name, id);
      switch (name) {
        case 'Customer': await upsertCustomer(realmId, full); break;
        case 'Item':     await upsertItem(realmId, full); break;
        case 'Invoice':  await upsertInvoice(realmId, full); break;
        case 'Estimate': await upsertEstimate(realmId, full); break;
      }
    }
  }
  return new Response('ok', { headers: { 'content-type': 'text/plain' } });
});
