// supabase/functions/health-db/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async () => {
  const sb = getServiceClient();
  const { error } = await sb.from('dashboard.logs').select('id').limit(1);
  return new Response(JSON.stringify({ success: !error, db: error ? error.message : 'ok' }), { headers: { 'content-type': 'application/json' } });
});
