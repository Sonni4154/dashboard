// supabase/functions/qbo-cdc-hourly/index.ts
import { getActiveRealms, runCdcForRealm, writeSyncHeartbeat } from '../_shared/sync.ts';
Deno.serve(async () => {
  const start = Date.now();
  const realms = await getActiveRealms();
  for (const realm of realms) await runCdcForRealm(realm);
  await writeSyncHeartbeat({ realms: realms.length, duration_ms: Date.now() - start });
  return new Response('cdc ok', { headers: { 'content-type': 'text/plain' } });
});
