// supabase/functions/qbo-manual-sync/index.ts
import { runCdcForRealm } from '../_shared/sync.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'POST,OPTIONS' }});
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const cors = { 'access-control-allow-origin': '*'};
  const { realmId } = await req.json();
  if (!realmId) return new Response('realmId required', { status: 400, headers: cors });
  await runCdcForRealm(String(realmId));
  return new Response('ok', { headers: cors });
});
